// ============================================================
// game.js — Motor principal do jogo "Revolução em Chamas"
// Encapsulado em IIFE para não poluir o escopo global,
// exceto pela referência pública window.frenchRevolutionGame.
// ============================================================
(function () {

  // ──────────────────────────────────────────────────────────
  // CLASSE: AudioManager
  // Gerencia todos os efeitos sonoros e a música de fundo
  // usando a Web Audio API do navegador.
  // ──────────────────────────────────────────────────────────
  class AudioManager {
    constructor() {
      this.ctx = null;   // contexto de áudio (criado sob demanda)
      this.nodes = [];   // lista de osciladores da música atual
    }

    // ensure() — Inicializa o AudioContext na primeira interação do usuário
    // (necessário pois navegadores bloqueiam áudio sem gesto do usuário).
    // Retorna o contexto criado ou null se a API não existir.
    ensure() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        this.ctx = new Ctx();

        // Cria dois nós de ganho separados: um para efeitos (fx) e outro para música
        this.fxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.fxGain.gain.value = 0.18;    // volume dos efeitos sonoros
        this.musicGain.gain.value = 0.05; // volume da música ambiente (bem mais baixo)
        this.fxGain.connect(this.ctx.destination);
        this.musicGain.connect(this.ctx.destination);
      }
      return this.ctx;
    }

    // resume() — Retoma o AudioContext caso esteja suspenso (política dos navegadores).
    // Chamado a cada interação de teclado/mouse.
    resume() {
      const ctx = this.ensure();
      if (ctx && ctx.state === "suspended") ctx.resume();
    }

    // beep(kind) — Gera um efeito sonoro sintético de curta duração.
    // Cada tipo de ação tem frequência, duração e forma de onda próprias.
    // Usa envelope ADSR simplificado (ramp up → ramp down) para evitar cliques.
    beep(kind) {
      const ctx = this.ensure();
      if (!ctx) return;

      // Mapa de configurações de áudio por tipo de ação
      const map = {
        shoot:   [420, 0.06, "square"],   // disparo: agudo e curto
        melee:   [180, 0.08, "sawtooth"], // corpo-a-corpo: grave e cru
        damage:  [130, 0.14, "triangle"], // receber dano: baixo e suave
        pickup:  [660, 0.12, "square"],   // coletar item: agudo e claro
        jump:    [300, 0.1,  "triangle"], // esquiva: médio
        reload:  [240, 0.15, "square"],   // recarregar: médio-baixo
        success: [520, 0.18, "sine"]      // fase concluída: harmônico e suave
      };

      const [freq, dur, type] = map[kind] || map.shoot;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.fxGain);

      // Envelope de volume: ataque em 10ms, decaimento até o fim da duração
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.start(now);
      osc.stop(now + dur);
    }

    // playMusic(name) — Para a música atual e inicia uma nova faixa ambiente.
    // A "música" é gerada por múltiplos osciladores formando acordes simples.
    // Cada fase tem uma tonalidade diferente para refletir o clima histórico.
    playMusic(name) {
      const ctx = this.ensure();
      if (!ctx) return;

      // Para todos os osciladores da música anterior
      this.nodes.forEach((node) => node.stop && node.stop());

      // Frequências (Hz) que formam o acorde de cada fase
      const chords = {
        phase1:  [196, 246.94, 293.66], // Sol maior — heroico
        phase2:  [146.83, 174.61, 220], // Ré menor — sombrio
        phase3:  [164.81, 207.65, 246.94], // Mi menor — tenso
        victory: [261.63, 329.63, 392]  // Dó maior — triunfal
      };

      // Cria um oscilador por frequência, com volume decrescente para harmônicos
      this.nodes = (chords[name] || chords.phase1).map((freq, index) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index === 1 ? "triangle" : "sine"; // harmônico do meio usa timbre diferente
        osc.frequency.value = freq;
        gain.gain.value = 0.03 - index * 0.006; // volume decresce por harmônico
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start();
        return osc;
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // CLASSE: DialogueBox
  // Controla a caixa de diálogo na parte inferior da tela.
  // Suporta sequência linear de falas e escolhas ramificadas.
  // ──────────────────────────────────────────────────────────
  class DialogueBox {
    constructor() {
      // Referências aos elementos HTML do diálogo
      this.box     = document.getElementById("dialogueBox");
      this.name    = document.getElementById("speakerName");
      this.text    = document.getElementById("dialogueText");
      this.choices = document.getElementById("dialogueChoices");

      this.data  = null; // objeto de diálogo ativo (nodes[])
      this.index = 0;    // índice do nó atual na sequência
      this.done  = null; // callback chamado ao fechar o diálogo
    }

    // open(dialogue, done) — Abre o diálogo e exibe a primeira fala.
    // 'done' é uma função opcional executada quando o diálogo se encerra.
    open(dialogue, done) {
      this.data  = dialogue;
      this.index = dialogue.start || 0;
      this.done  = done || null;
      this.box.classList.remove("hidden");
      this.render();
    }

    // render() — Atualiza o HTML da caixa com o nó atual.
    // Se o nó tiver 'choices', cria botões clicáveis para cada opção.
    render() {
      const node = this.data && this.data.nodes[this.index];
      if (!node) return this.close(); // sem nó = encerrar diálogo

      this.name.textContent = node.speaker;
      this.text.textContent = node.text;
      this.choices.innerHTML = "";

      // Cria um botão HTML para cada escolha do jogador
      (node.choices || []).forEach((choice) => {
        const button = document.createElement("button");
        button.className = "choice-button";
        button.textContent = choice.text;
        button.onclick = () => {
          if (choice.effect) choice.effect(); // executa efeito de jogo da escolha (ex: alterar flags)
          this.index = choice.next;           // salta para o nó indicado pela escolha
          this.render();
        };
        this.choices.appendChild(button);
      });
    }

    // advance() — Avança para a próxima fala ao pressionar E.
    // Retorna true enquanto o diálogo ainda está ativo (bloqueia input do jogo).
    advance() {
      if (!this.data) return false;
      const node = this.data.nodes[this.index];

      // Se o nó atual tem escolhas pendentes, não avança automaticamente
      if (node && node.choices && node.choices.length) return true;

      this.index += 1;
      if (!this.data.nodes[this.index]) {
        this.close();   // chegou ao último nó, fecha o diálogo
        return true;
      }
      this.render();
      return true;
    }

    // close() — Oculta a caixa de diálogo e dispara o callback 'done' se existir.
    close() {
      this.data  = null;
      this.box.classList.add("hidden");
      this.choices.innerHTML = "";
      const callback = this.done;
      this.done = null;
      if (callback) callback(); // ex: avançar para próxima sub-fase após cutscene
    }

    // get active — Getter: retorna true se há um diálogo em andamento.
    // Usado para pausar o movimento e ações durante falas.
    get active() {
      return Boolean(this.data);
    }
  }

  // ──────────────────────────────────────────────────────────
  // CLASSE: Game
  // Núcleo do jogo: gerencia o loop principal, todas as entidades
  // (jogador, inimigos, NPCs, projéteis, pickups), input, HUD,
  // carregamento de fases e condições de vitória/derrota.
  // ──────────────────────────────────────────────────────────
  class Game {
    constructor() {
      // Carrega as definições das 3 fases dos arquivos phase1/2/3.js
      this.phases = [window.phaseOneDefinition, window.phaseTwoDefinition, window.phaseThreeDefinition].filter(Boolean);

      // Referências ao canvas e ao contexto 2D de renderização
      this.canvas = document.getElementById("gameCanvas");
      this.ctx    = this.canvas.getContext("2d");

      // Instâncias dos subsistemas de áudio e diálogo
      this.audio    = new AudioManager();
      this.dialogue = new DialogueBox();

      // Referências ao painel de sobreposição (tela inicial, derrota, vitória)
      this.overlay = {
        panel:  document.getElementById("messageOverlay"),
        title:  document.getElementById("overlayTitle"),
        body:   document.getElementById("overlayBody"),
        button: document.getElementById("startButton")
      };

      // Referências a todos os elementos do HUD lateral
      this.hud = {
        hpBar:         document.getElementById("hpBar"),
        hpText:        document.getElementById("hpText"),
        ammoText:      document.getElementById("ammoText"),
        timerText:     document.getElementById("timerText"),
        scoreText:     document.getElementById("scoreText"),
        phaseText:     document.getElementById("phaseText"),
        objectiveText: document.getElementById("objectiveText")
      };

      // Pré-carrega todas as imagens SVG dos sprites
      this.images = this.loadImages();

      // Estado de entrada do jogador: teclas pressionadas, posição do mouse e botão de tiro
      this.input = { keys: new Set(), mx: 480, my: 270, firing: false };

      // Cria o objeto do jogador com atributos iniciais
      this.player = this.makePlayer();

      // Flags globais de estado da fase (ex: prisioneiro libertado, NPC conversado)
      this.flags = {};

      // Índices da fase e sub-fase (stage) atual
      this.phaseIndex = 0;
      this.stageIndex = 0;

      this.last       = 0;   // timestamp do último frame (usado para calcular delta)
      this.stageTimer = 0;   // contador regressivo de tempo da sub-fase atual

      // Listas de entidades ativas no mundo
      this.enemies     = [];
      this.npcs        = [];
      this.walls       = [];
      this.projectiles = [];
      this.pickups     = [];

      this.currentTrack = "phase1"; // nome da trilha sonora atual

      this.bind();      // registra todos os listeners de input
      this.bootstrap(); // valida as fases e exibe a tela inicial
    }

    // bootstrap() — Verifica se as 3 fases foram carregadas corretamente.
    // Em caso de erro, exibe mensagem de falha. Em caso de sucesso, mostra o intro.
    bootstrap() {
      if (this.phases.length !== 3) {
        this.overlay.title.textContent = "Erro ao carregar o jogo";
        this.overlay.body.textContent  = "As fases não foram carregadas corretamente. Verifique se os arquivos js/phase1.js, js/phase2.js e js/phase3.js estão presentes.";
        this.overlay.button.textContent = "Recarregar";
        this.overlay.button.onclick = () => window.location.reload();
        this.overlay.panel.classList.remove("hidden");
        return;
      }
      this.showIntro();
      this.render(); // renderiza o canvas mesmo antes de iniciar (fundo visível)
    }

    // uuid() — Gera um identificador único para cada entidade (inimigos etc.).
    // Usa crypto.randomUUID() se disponível, ou um fallback com timestamp+random.
    uuid() {
      return window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    // loadImages() — Pré-carrega todos os sprites SVG do jogo em objetos Image.
    // Retorna um dicionário { chave: HTMLImageElement } para uso em drawSprite().
    loadImages() {
      const files = {
        protagonist:  "./assets/images/principalCharacter.svg",
        napoleon:     "./assets/images/napoleonBonaparte.svg",
        louis:        "./assets/images/kingLuisXIV.svg",
        marie:        "./assets/images/marieAntoinette.svg",
        robespierre:  "./assets/images/robespierre.svg",
        royalGuard:   "./assets/images/royalGuard.svg",
        musketeer:    "./assets/images/musketeer.svg",
        prisoner:     "./assets/images/prisoner.svg",
        orator:       "./assets/images/orator.svg",
        seamstress:   "./assets/images/seamstress.svg",
        royalist:     "./assets/images/royalist.svg",
        civilian:     "./assets/images/civilian.svg",
        jacobin:      "./assets/images/jacobinGuard.svg",
        eliteGuard:   "./assets/images/eliteGuard.svg",
        mercenary:    "./assets/images/mercenary.svg",
        radical:      "./assets/images/radical.svg",
        councilGuard: "./assets/images/councilGuard.svg",
        pickupHealth: "./assets/images/baguette.svg",
        pickupAmmo:   "./assets/images/powder.svg",
        pickupScore:  "./assets/images/revolutionSeal.svg"
      };
      const images = {};
      Object.keys(files).forEach((key) => {
        const image = new Image();
        image.src = files[key];
        images[key] = image;
      });
      return images;
    }

    // makePlayer() — Retorna o objeto de estado inicial do jogador.
    // Reiniciado no início de cada campanha (não entre sub-fases).
    makePlayer() {
      return {
        x: 120, y: 260,        // posição inicial (sobrescrita pelo spawn da fase)
        r: 16,                 // raio de colisão
        hp: 100, maxHp: 100,   // vida atual e máxima
        ammo: 12, maxAmmo: 12, // munição atual e máxima
        score: 0,              // pontuação acumulada
        facing: 0,             // ângulo de direção (em radianos, relativo ao mouse)
        fireCd: 0,             // cooldown de disparo
        meleeCd: 0,            // cooldown de ataque corpo-a-corpo
        dashCd: 0,             // cooldown de esquiva
        invul: 0,              // tempo de invulnerabilidade após receber dano
        crouching: false,      // estado de agachamento (C)
        rescued: 0,            // prisioneiros libertados (Fase 1)
        choices: { mercy: 0, discipline: 0 } // contadores de escolhas morais
      };
    }

    // resetWorld() — Limpa todas as entidades do mundo antes de carregar nova sub-fase.
    resetWorld() {
      this.enemies     = [];
      this.npcs        = [];
      this.walls       = [];
      this.projectiles = [];
      this.pickups     = [];
      this.stageTimer  = 0;
    }

    // showIntro() — Exibe o painel de overlay com o texto introdutório e
    // configura o botão "Iniciar Campanha" para chamar startCampaign().
    showIntro() {
      this.overlay.title.textContent  = "Revolução em Chamas";
      this.overlay.body.textContent   = "Você é um cidadão revolucionário atravessando a Bastilha, o Terror e a ascensão de Napoleão. Clique em iniciar, use WASD para se mover, atire com o mouse e interaja com E.";
      this.overlay.button.textContent = "Iniciar Campanha";
      this.overlay.button.onclick     = () => this.startCampaign();
      this.overlay.panel.classList.remove("hidden");
    }

    // bind() — Registra todos os event listeners de input do jogo:
    // teclado (keydown/keyup), mouse (mousemove, mousedown, mouseup).
    bind() {
      window.addEventListener("keydown", (event) => {
        this.audio.resume(); // garante que o áudio seja retomado na primeira interação
        const key = event.key.toLowerCase();

        // E durante diálogo apenas avança a fala, sem acionar interact() novamente
        if (key === "e" && this.dialogue.active) {
          this.dialogue.advance();
          return;
        }

        this.input.keys.add(key);

        // Mapeamento de teclas para ações do jogo
        if (key === "e")     this.interact();
        if (key === "r")     this.reload();
        if (key === "c")     this.player.crouching = true;
        if (key === "shift") this.melee();
        if (event.key === " ") {
          event.preventDefault(); // previne scroll da página com espaço
          this.dash();
        }
      });

      window.addEventListener("keyup", (event) => {
        const key = event.key.toLowerCase();
        this.input.keys.delete(key); // remove a tecla do Set ao soltar
        if (key === "c") this.player.crouching = false;
      });

      // Rastreia a posição do mouse no canvas, convertendo coordenadas de tela
      // para coordenadas internas do canvas (considerando escala CSS)
      this.canvas.addEventListener("mousemove", (event) => {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mx = ((event.clientX - rect.left) / rect.width)  * this.canvas.width;
        this.input.my = ((event.clientY - rect.top)  / rect.height) * this.canvas.height;
      });

      // Botão esquerdo pressionado = iniciar disparo contínuo
      this.canvas.addEventListener("mousedown", () => {
        this.audio.resume();
        this.input.firing = true;
      });

      // Soltar o botão para o disparo
      window.addEventListener("mouseup", () => {
        this.input.firing = false;
      });
    }

    // startCampaign() — Reinicia o jogo do zero: recria o jogador, limpa flags,
    // carrega a primeira fase e inicia o loop principal de game loop.
    startCampaign() {
      this.player       = this.makePlayer();
      this.flags        = {};
      this.phaseIndex   = 0;
      this.stageIndex   = 0;
      this.currentTrack = "phase1";
      this.overlay.panel.classList.add("hidden");
      this.audio.playMusic("phase1");
      this.loadStage(0, 0);
      this.last = performance.now();
      requestAnimationFrame((time) => this.loop(time)); // inicia o game loop
    }

    // loadStage(phaseIndex, stageIndex) — Carrega uma sub-fase específica:
    // reseta o mundo, popula inimigos/NPCs/walls/pickups a partir da definição
    // da fase, posiciona o jogador no spawn e chama onStart() se definido.
    loadStage(phaseIndex, stageIndex) {
      this.phaseIndex = phaseIndex;
      this.stageIndex = stageIndex;
      this.flags = {}; // reseta flags locais da sub-fase
      this.resetWorld();

      this.phase = this.phases[phaseIndex];
      this.stage = this.phase.subStages[stageIndex];

      // Posiciona o jogador no ponto de spawn definido pela sub-fase
      this.player.x    = this.stage.playerSpawn.x;
      this.player.y    = this.stage.playerSpawn.y;
      this.player.hp   = this.player.maxHp;   // restaura vida completa entre fases
      this.player.ammo = this.player.maxAmmo; // restaura munição completa
      this.player.invul = 0;

      // Reseta contador de prisioneiros apenas no início absoluto do jogo
      if (phaseIndex === 0 && stageIndex === 0) this.player.rescued = 0;

      this.stageTimer = this.stage.timeLimit;

      // Cria cópias dos objetos definidos na fase (evita mutação dos dados originais)
      this.walls   = this.stage.walls.map((wall)   => Object.assign({}, wall));
      this.enemies = this.stage.enemies.map((enemy) =>
        Object.assign({ id: this.uuid(), dead: false, attackCooldown: 0 }, enemy)
      );
      this.npcs    = this.stage.npcs.map((npc, index) => Object.assign({ id: "npc-" + index }, npc));
      this.pickups = this.stage.pickups.map((pickup) => Object.assign({ r: 10 }, pickup));

      // Executa o hook de início da sub-fase (ex: abrir diálogo introdutório)
      this.stage.onStart && this.stage.onStart(this);
      this.updateHud();
      this.render();
    }

    // nextStage() — Avança para a próxima sub-fase ou fase.
    // Se esgotou todas as sub-fases da fase atual, passa para a próxima fase.
    // Se esgotou todas as fases, encerra o jogo com vitória.
    nextStage() {
      this.audio.beep("success");

      // Ainda há sub-fases na fase atual?
      if (this.stageIndex + 1 < this.phase.subStages.length) {
        this.loadStage(this.phaseIndex, this.stageIndex + 1);
        return;
      }

      // Ainda há fases seguintes?
      if (this.phaseIndex + 1 < this.phases.length) {
        const nextPhase = this.phaseIndex + 1;
        const tracks    = ["phase1", "phase2", "phase3"];
        this.currentTrack = tracks[nextPhase];
        this.audio.playMusic(this.currentTrack);
        this.loadStage(nextPhase, 0);
        return;
      }

      // Completou todas as fases
      this.finishGame();
    }

    // finishGame() — Exibe o painel de vitória com pontuação e escolhas morais do jogador.
    finishGame() {
      this.audio.playMusic("victory");
      this.overlay.title.textContent  = "O Consulado";
      this.overlay.body.textContent   = "Napoleão assume o poder. Pontuação: " + this.player.score +
        ". Misericórdia: " + this.player.choices.mercy +
        ". Disciplina: " + this.player.choices.discipline + ".";
      this.overlay.button.textContent = "Jogar Novamente";
      this.overlay.button.onclick     = () => this.startCampaign();
      this.overlay.panel.classList.remove("hidden");
    }

    // failStage(message) — Exibe o painel de derrota com a mensagem de falha.
    // O botão "Repetir Missão" recarrega a mesma sub-fase.
    failStage(message) {
      this.overlay.title.textContent  = "Missão Fracassada";
      this.overlay.body.textContent   = message;
      this.overlay.button.textContent = "Repetir Missão";
      this.overlay.button.onclick     = () => {
        this.overlay.panel.classList.add("hidden");
        this.audio.playMusic(this.currentTrack);
        this.loadStage(this.phaseIndex, this.stageIndex);
        this.last = performance.now();
        requestAnimationFrame((time) => this.loop(time)); // reinicia o game loop
      };
      this.overlay.panel.classList.remove("hidden");
    }

    // loop(timestamp) — Game loop principal, chamado pelo requestAnimationFrame.
    // Calcula o delta de tempo entre frames (máx 32ms para evitar espirais de morte),
    // chama update() e render(), e agenda o próximo frame.
    loop(timestamp) {
      const delta = Math.min(0.032, (timestamp - this.last) / 1000); // delta em segundos
      this.last = timestamp;

      // Se o overlay estiver visível (pausa/derrota/vitória), apenas renderiza e para o loop
      if (!this.overlay.panel.classList.contains("hidden")) {
        this.render();
        return;
      }

      this.update(delta);
      this.render();

      // Continua o loop somente se o overlay ainda estiver oculto (jogo rodando)
      if (this.overlay.panel.classList.contains("hidden")) requestAnimationFrame((time) => this.loop(time));
    }

    // update(delta) — Atualiza o estado completo do jogo a cada frame.
    // Pausa toda a lógica durante diálogos ativos.
    // Verifica o timer da fase, resfriamentos de ações, e chama os updaters específicos.
    update(delta) {
      // Durante diálogo, apenas atualiza o HUD e congela o jogo
      if (this.dialogue.active) {
        this.updateHud();
        return;
      }

      // Decrementa o timer da fase e falha se zerar
      this.stageTimer -= delta;
      if (this.stageTimer <= 0) {
        this.failStage("O tempo acabou antes que você concluísse esta missão.");
        return;
      }

      // Reduz cooldowns de ações do jogador (tiro, corpo-a-corpo, esquiva, invulnerabilidade)
      this.player.fireCd  = Math.max(0, this.player.fireCd  - delta);
      this.player.meleeCd = Math.max(0, this.player.meleeCd - delta);
      this.player.dashCd  = Math.max(0, this.player.dashCd  - delta);
      this.player.invul   = Math.max(0, this.player.invul   - delta);

      // Atualiza todas as entidades e coleta itens
      this.updatePlayer(delta);
      this.updateEnemies(delta);
      this.updateProjectiles(delta);
      this.collectPickups();

      // Executa o hook de atualização definido pela sub-fase atual (ex: verificar objetivos)
      if (this.stage.onUpdate) this.stage.onUpdate(this, delta);

      this.updateHud();
    }

    // updatePlayer(delta) — Move o jogador com base nas teclas WASD,
    // normaliza o vetor de direção para velocidade constante em diagonal,
    // aplica redução de velocidade ao agachar, colide com paredes e atira.
    updatePlayer(delta) {
      const dx  = (this.input.keys.has("d") ? 1 : 0) - (this.input.keys.has("a") ? 1 : 0);
      const dy  = (this.input.keys.has("s") ? 1 : 0) - (this.input.keys.has("w") ? 1 : 0);
      const len = Math.hypot(dx, dy) || 1; // evita divisão por zero quando parado
      const speed = 150 * (this.player.crouching ? 0.45 : 1); // agachado = 45% da velocidade
      this.player.x += (dx / len) * speed * delta;
      this.player.y += (dy / len) * speed * delta;
      this.clampAndCollide(this.player);

      // Orienta o personagem em direção ao cursor do mouse
      this.player.facing = Math.atan2(
        this.input.my - this.player.y,
        this.input.mx - this.player.x
      );

      // Disparo automático enquanto o botão do mouse estiver pressionado
      if (this.input.firing) this.shoot();
    }

    // clampAndCollide(entity) — Restringe a entidade aos limites do canvas
    // e empurra para fora de qualquer parede retangular com que colida.
    // Usa projeção no eixo de menor sobreposição (horizontal ou vertical).
    clampAndCollide(entity) {
      const radius = entity.r || entity.radius;

      // Limita a posição dentro do canvas
      entity.x = Math.max(radius, Math.min(this.canvas.width  - radius, entity.x));
      entity.y = Math.max(radius, Math.min(this.canvas.height - radius, entity.y));

      // Verifica colisão com cada parede (AABB vs círculo)
      this.walls.forEach((wall) => {
        // Ponto mais próximo da parede ao centro da entidade
        const nearX = Math.max(wall.x, Math.min(entity.x, wall.x + wall.width));
        const nearY = Math.max(wall.y, Math.min(entity.y, wall.y + wall.height));
        const dx = entity.x - nearX;
        const dy = entity.y - nearY;
        if (dx * dx + dy * dy < radius * radius) {
          // Resolve pela direção de menor penetração
          if (Math.abs(dx) > Math.abs(dy)) entity.x = dx > 0 ? nearX + radius : nearX - radius;
          else                             entity.y = dy > 0 ? nearY + radius : nearY - radius;
        }
      });
    }

    // shoot() — Cria um projétil do jogador na direção do cursor.
    // Respeita o cooldown de disparo e verifica se há munição disponível.
    shoot() {
      if (this.player.fireCd > 0 || this.player.ammo <= 0) return;
      this.projectiles.push({
        x:      this.player.x,
        y:      this.player.y,
        vx:     Math.cos(this.player.facing) * 340, // velocidade horizontal
        vy:     Math.sin(this.player.facing) * 340, // velocidade vertical
        r:      4,          // raio do projétil
        life:   1.2,        // tempo de vida em segundos
        damage: 20,         // dano causado ao atingir inimigo
        owner:  "player",
        color:  "#fde68a"
      });
      this.player.ammo  -= 1;
      this.player.fireCd = 0.24; // ~4 tiros por segundo
      this.audio.beep("shoot");
    }

    // melee() — Executa ataque corpo-a-corpo (Shift):
    // causa dano a todos os inimigos dentro do raio de alcance (56px).
    melee() {
      if (this.player.meleeCd > 0 || this.dialogue.active) return;
      this.player.meleeCd = 0.6;
      this.audio.beep("melee");
      this.enemies.forEach((enemy) => {
        if (!enemy.dead && Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) < 56)
          this.hitEnemy(enemy, 22);
      });
    }

    // reload() — Restaura a munição ao máximo instantaneamente (R).
    // Não faz nada se a munição já estiver cheia.
    reload() {
      if (this.player.ammo === this.player.maxAmmo) return;
      this.player.ammo = this.player.maxAmmo;
      this.audio.beep("reload");
    }

    // dash() — Executa uma esquiva rápida (Espaço) na direção que o jogador está mirando.
    // Move 38px instantaneamente e aplica cooldown de ~1 segundo.
    dash() {
      if (this.player.dashCd > 0 || this.dialogue.active) return;
      this.player.dashCd = 1.1;
      this.player.x += Math.cos(this.player.facing) * 38;
      this.player.y += Math.sin(this.player.facing) * 38;
      this.clampAndCollide(this.player); // garante que não atravesse paredes ao esquivar
      this.audio.beep("jump");
    }

    // damagePlayer(amount) — Aplica dano ao jogador, respeitando invulnerabilidade.
    // Agachar reduz o dano recebido em 40%. Se HP chegar a 0, dispara failStage().
    damagePlayer(amount) {
      if (this.player.invul > 0) return;
      this.player.hp  -= amount * (this.player.crouching ? 0.6 : 1);
      this.player.invul = 0.5; // 0,5 s de invulnerabilidade após levar dano
      this.audio.beep("damage");
      if (this.player.hp <= 0) {
        this.player.hp = 0;
        this.failStage("Você caiu antes de conseguir mudar o curso da história.");
      }
    }

    // updateEnemies(delta) — Processa a IA de cada inimigo vivo:
    // - "chaser": persegue o jogador em linha reta quando próximo
    // - "patrol": se move em padrão circular/senoidal usando seno/cosseno do tempo
    // - "turret": fica estático mas atira projéteis periodicamente
    // Também aplica dano corpo-a-corpo por contato e remove inimigos mortos.
    updateEnemies(delta) {
      this.enemies.forEach((enemy) => {
        if (enemy.dead) return;
        enemy.attackCooldown = Math.max(0, (enemy.attackCooldown || 0) - delta);

        const dx       = this.player.x - enemy.x;
        const dy       = this.player.y - enemy.y;
        const distance = Math.hypot(dx, dy);

        // IA tipo "chaser": move em direção ao jogador se estiver dentro do raio de detecção
        if (enemy.ai === "chaser" && distance < (enemy.noticeRadius || 240)) {
          enemy.x += (dx / (distance || 1)) * enemy.speed * delta;
          enemy.y += (dy / (distance || 1)) * enemy.speed * delta;
        }

        // IA tipo "patrol": movimento oscilatório usando tempo + posição como semente
        if (enemy.ai === "patrol") {
          const angle = performance.now() / 850 + enemy.x * 0.01;
          enemy.x += Math.cos(angle) * enemy.speed * 0.24 * delta;
          enemy.y += Math.sin(angle) * enemy.speed * 0.24 * delta;
        }

        // IA tipo "turret": dispara projétil em direção ao jogador com cooldown
        if (enemy.ai === "turret" && distance < (enemy.noticeRadius || 260) && enemy.attackCooldown <= 0) {
          this.projectiles.push({
            x:      enemy.x,
            y:      enemy.y,
            vx:     (dx / (distance || 1)) * 220,
            vy:     (dy / (distance || 1)) * 220,
            r:      4,
            life:   1.6,
            damage: enemy.rangedDamage || 10,
            owner:  "enemy",
            color:  "#fb7185"
          });
          enemy.attackCooldown = 1.1; // intervalo entre tiros do inimigo
        }

        // Colisão física com paredes
        const body = { x: enemy.x, y: enemy.y, r: enemy.radius };
        this.clampAndCollide(body);
        enemy.x = body.x;
        enemy.y = body.y;

        // Dano corpo-a-corpo por contato físico com o jogador
        if (distance < enemy.radius + this.player.r + 2 && enemy.attackCooldown <= 0) {
          this.damagePlayer(enemy.meleeDamage || 10);
          enemy.attackCooldown = 0.8;
        }
      });

      // Remove da lista todos os inimigos marcados como mortos
      this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    }

    // updateProjectiles(delta) — Move cada projétil, detecta colisões
    // com inimigos (se do jogador) ou com o jogador (se de inimigo),
    // e remove projéteis que saíram da tela ou esgotaram seu tempo de vida.
    updateProjectiles(delta) {
      this.projectiles.forEach((projectile) => {
        projectile.x    += projectile.vx * delta;
        projectile.y    += projectile.vy * delta;
        projectile.life -= delta;

        if (projectile.owner === "player") {
          // Verifica colisão com cada inimigo vivo
          this.enemies.forEach((enemy) => {
            if (!enemy.dead && Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) <= projectile.r + enemy.radius) {
              projectile.life = 0; // destrói o projétil ao acertar
              this.hitEnemy(enemy, projectile.damage);
            }
          });
        } else {
          // Projétil de inimigo: verifica colisão com o jogador
          if (Math.hypot(projectile.x - this.player.x, projectile.y - this.player.y) <= projectile.r + this.player.r) {
            projectile.life = 0;
            this.damagePlayer(projectile.damage);
          }
        }
      });

      // Remove projéteis expirados ou fora dos limites do canvas
      this.projectiles = this.projectiles.filter((projectile) =>
        projectile.life > 0 &&
        projectile.x > -20 && projectile.x < this.canvas.width  + 20 &&
        projectile.y > -20 && projectile.y < this.canvas.height + 20
      );
    }

    // hitEnemy(enemy, damage) — Aplica dano a um inimigo.
    // Se o HP chegar a zero: marca como morto, soma pontos ao jogador,
    // dropa loot aleatório e chama o hook onEnemyDefeated() da fase.
    hitEnemy(enemy, damage) {
      enemy.hp -= damage;
      if (enemy.hp > 0) return;

      enemy.dead = true;
      this.player.score += enemy.meta && enemy.meta.score ? enemy.meta.score : 50;

      // Drop de loot: escolhe aleatoriamente um item da tabela do inimigo
      if (enemy.lootTable && enemy.lootTable.length) {
        const loot = enemy.lootTable[Math.floor(Math.random() * enemy.lootTable.length)];
        if (loot) this.pickups.push(Object.assign({ r: 10, x: enemy.x, y: enemy.y }, loot));
      }

      // Notifica a fase (ex: Luís XVI derrotado → avança a sub-fase)
      if (this.stage.onEnemyDefeated) this.stage.onEnemyDefeated(this, enemy);
    }

    // collectPickups() — Verifica se o jogador tocou algum item no chão.
    // Aplica o efeito correspondente (cura, munição ou pontos) e remove o item.
    collectPickups() {
      this.pickups = this.pickups.filter((pickup) => {
        if (Math.hypot(pickup.x - this.player.x, pickup.y - this.player.y) > pickup.r + this.player.r)
          return true; // ainda longe, mantém na lista

        if (pickup.kind === "health") this.player.hp    = Math.min(this.player.maxHp,   this.player.hp   + pickup.value);
        if (pickup.kind === "ammo")   this.player.ammo  = Math.min(this.player.maxAmmo, this.player.ammo + pickup.value);
        if (pickup.kind === "score")  this.player.score += pickup.value;
        this.audio.beep("pickup");
        return false; // remove da lista ao coletar
      });
    }

    // interact() — Ação de interação (E): avança diálogos em andamento
    // ou inicia o diálogo do NPC mais próximo (dentro de 44px).
    interact() {
      if (this.dialogue.active) {
        this.dialogue.advance();
        return;
      }
      // Encontra o NPC mais próximo dentro do raio de interação
      const npc = this.npcs.find((unit) => Math.hypot(unit.x - this.player.x, unit.y - this.player.y) < 44);
      if (npc && npc.dialogueId && this.stage.dialogues && this.stage.dialogues[npc.dialogueId]) {
        // Abre o diálogo; ao fechar, chama onTalk() do NPC se definido
        this.dialogue.open(
          this.stage.dialogues[npc.dialogueId],
          () => npc.meta && npc.meta.onTalk && npc.meta.onTalk(this)
        );
        return;
      }
      // Hook genérico de interação da fase (para casos especiais)
      if (this.stage.onInteract) this.stage.onInteract(this);
    }

    // updateHud() — Sincroniza todos os elementos visuais do HUD lateral
    // com os valores atuais do estado do jogo (vida, munição, timer, pontos etc.).
    updateHud() {
      this.hud.hpBar.style.width    = ((this.player.hp / this.player.maxHp) * 100) + "%";
      this.hud.hpText.textContent   = Math.ceil(this.player.hp) + " / " + this.player.maxHp;
      this.hud.ammoText.textContent = this.player.ammo + " / " + this.player.maxAmmo;
      this.hud.timerText.textContent = this.formatTime(this.stageTimer);
      this.hud.scoreText.textContent = String(this.player.score);
      this.hud.phaseText.textContent = (this.phase ? this.phase.title : "Prólogo") + " " + (this.stageIndex + 1);
      this.hud.objectiveText.textContent = this.stage ? this.stage.objective : "Abra caminho.";
    }

    // formatTime(totalSeconds) — Converte segundos em string "MM:SS" para o HUD.
    formatTime(totalSeconds) {
      const safe    = Math.max(0, Math.ceil(totalSeconds || 0));
      const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
      const seconds = String(safe % 60).padStart(2, "0");
      return minutes + ":" + seconds;
    }

    // pickupSpriteName(kind) — Retorna a chave do sprite correspondente ao tipo de pickup.
    pickupSpriteName(kind) {
      if (kind === "health") return "pickupHealth";
      if (kind === "ammo")   return "pickupAmmo";
      return "pickupScore";
    }

    // getEntitySpriteSize(entity, minimumSize) — Define um tamanho de render maior
    // para sprites sem alterar a lógica de colisão ou o fluxo do jogo.
    getEntitySpriteSize(entity, minimumSize) {
      if (entity.renderSize) return entity.renderSize;
      const radius = entity.r || entity.radius || 14;
      return Math.max(minimumSize || 44, Math.round(radius * 3.2));
    }

    // getPickupSpriteSize(pickup) — Mantém pickups visualmente legíveis no mapa.
    getPickupSpriteSize(pickup) {
      if (pickup.renderSize) return pickup.renderSize;
      return Math.max(26, Math.round((pickup.r || 10) * 2.8));
    }

    // drawSprite(name, x, y, size, fallbackColor) — Tenta desenhar o sprite SVG pré-carregado.
    // Se a imagem ainda não carregou ou não existe, desenha um retângulo colorido de fallback.
    drawSprite(name, x, y, size, fallbackColor) {
      const image = this.images[name];
      if (image && image.complete && image.naturalWidth > 0) {
        this.ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
        return true;
      }
      // Fallback visual enquanto a imagem carrega
      this.ctx.fillStyle = fallbackColor || "#ddd";
      this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
      return false;
    }

    // drawPlayer() — Renderiza o sprite do protagonista rotacionado em direção ao cursor.
    // Desenha um indicador de cano da arma e um anel dourado durante invulnerabilidade.
    drawPlayer() {
      const ctx = this.ctx;
      const spriteSize = this.getEntitySpriteSize(this.player, 50);
      const rifleWidth = 4;
      const rifleHeight = Math.round(spriteSize * 0.32);
      const rifleOffset = Math.round(spriteSize * 0.54);
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.player.facing + Math.PI / 2); // +90° para alinhar sprite ao eixo de mira

      if (!this.drawSprite("protagonist", 0, 0, spriteSize, this.player.crouching ? "#f59e0b" : "#ef4444")) {
        // Fallback: linha de cano quando o sprite não carregou
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(-2, -rifleOffset, rifleWidth, rifleHeight);
      } else {
        // Mesmo com sprite, desenha indicador de cano por cima
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(-2, -rifleOffset, rifleWidth, rifleHeight);
      }
      ctx.restore();

      // Anel de invulnerabilidade (aparece por 0,5 s após levar dano)
      if (this.player.invul > 0) {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.75)";
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, Math.round(spriteSize * 0.62), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // drawActor(actor, isNpc) — Renderiza inimigo ou NPC:
    // sprite + nome + barra de vida vermelha (apenas para inimigos).
    drawActor(actor, isNpc) {
      const spriteSize = this.getEntitySpriteSize(actor, 46);
      const hpBarWidth = Math.max(36, Math.round(spriteSize * 0.92));
      const hpBarX = actor.x - hpBarWidth / 2;
      const hpBarY = actor.y + Math.max(actor.radius + 6, Math.round(spriteSize * 0.36));
      const nameY = actor.y - Math.max(actor.radius + 12, Math.round(spriteSize * 0.52));

      this.drawSprite(actor.sprite, actor.x, actor.y, spriteSize, actor.color || "#ddd");

      // Nome do ator acima do sprite
      this.ctx.save();
      this.ctx.fillStyle = "#fafaf9";
      this.ctx.font = "bold " + Math.max(11, Math.round(spriteSize * 0.2)) + "px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(actor.name, actor.x, nameY);
      this.ctx.restore();

      // Barra de vida: fundo escuro + preenchimento vermelho proporcional ao HP atual
      if (!isNpc) {
        this.ctx.fillStyle = "rgba(0,0,0,0.55)";
        this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, 5);
        this.ctx.fillStyle = "#ef4444";
        this.ctx.fillRect(hpBarX, hpBarY, (actor.hp / actor.maxHp) * hpBarWidth, 5);
      }
    }

    // drawSpecialStageMarkers() — Desenha marcadores visuais específicos de certas sub-fases:
    // - "O Diretório": armadilhas amarelas translúcidas no chão
    // - Fases com zona de saída: retângulo verde à direita do canvas
    drawSpecialStageMarkers() {
      if (!this.stage) return;
      const ctx = this.ctx;

      // Visualiza as armadilhas de chão em "O Diretório"
      if (this.stage.name === "O Diretório") {
        [{ x: 150, y: 140 }, { x: 520, y: 80 }, { x: 780, y: 280 }].forEach((trap) => {
          ctx.fillStyle = "rgba(250, 204, 21, 0.45)";
          ctx.fillRect(trap.x, trap.y, 40, 40);
        });
      }

      // Zona de saída verde para fases que exigem chegar ao lado direito do mapa
      if (
        this.stage.name === "O Grande Terror" ||
        this.stage.name === "O Diretório"     ||
        this.stage.name === "18 de Brumário"
      ) {
        ctx.fillStyle = "rgba(34,197,94,0.22)";
        ctx.fillRect(910, 28, 20, 484);
      }
    }

    // render() — Renderiza um frame completo do jogo no canvas:
    // fundo xadrez, marcadores especiais, paredes, pickups, entidades,
    // projéteis, cursor customizado e informações de fase no canto superior.
    render() {
      const ctx     = this.ctx;
      const palette = this.stage ? this.stage.palette : { floor: "#1c1917", accent: "#7f1d1d", line: "#f59e0b" };

      // Limpa o canvas e preenche com a cor de chão da fase atual
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = palette.floor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Grade xadrez decorativa com baixa opacidade para dar textura ao chão
      ctx.globalAlpha = 0.18;
      for (let x = 0; x < this.canvas.width; x += 48) {
        for (let y = 0; y < this.canvas.height; y += 48) {
          ctx.fillStyle = (x + y) % 96 === 0 ? palette.accent : "#0c0a09";
          ctx.fillRect(x, y, 44, 44);
        }
      }
      ctx.globalAlpha = 1;

      // Marcadores especiais de sub-fase (armadilhas, zona de saída)
      this.drawSpecialStageMarkers();

      // Desenha todas as paredes
      this.walls.forEach((wall) => {
        ctx.fillStyle = wall.color || "#57534e";
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      });

      // Desenha pickups no chão
      this.pickups.forEach((pickup) => {
        this.drawSprite(this.pickupSpriteName(pickup.kind), pickup.x, pickup.y, this.getPickupSpriteSize(pickup), pickup.color);
      });

      // Desenha entidades: jogador, inimigos e NPCs
      this.drawPlayer();
      this.enemies.forEach((enemy) => this.drawActor(enemy, false));
      this.npcs.forEach((npc)       => this.drawActor(npc,   true));

      // Desenha todos os projéteis como círculos coloridos
      this.projectiles.forEach((projectile) => {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cursor customizado: anel branco semitransparente na posição do mouse
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(this.input.mx, this.input.my, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Painel de informações da sub-fase no canto superior esquerdo (nome + subtítulo)
      ctx.fillStyle = "rgba(12,10,9,0.62)";
      ctx.fillRect(14, 14, 420, 56);
      ctx.strokeStyle = "rgba(251,191,36,0.24)";
      ctx.strokeRect(14, 14, 420, 56);
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(this.stage ? this.stage.name     : "Prólogo",            26, 35);
      ctx.fillStyle = "#e7e5e4";
      ctx.font = "12px sans-serif";
      ctx.fillText(this.stage ? this.stage.subtitle : "Campanha Histórica", 26, 55);
    }
  }

  // ──────────────────────────────────────────────────────────
  // INICIALIZAÇÃO
  // Instancia o jogo após o carregamento completo da página e
  // expõe a instância globalmente para os scripts de fase
  // poderem acessar via window.frenchRevolutionGame.
  // ──────────────────────────────────────────────────────────
  window.addEventListener("load", () => {
    window.frenchRevolutionGame = new Game();
  });

})();
