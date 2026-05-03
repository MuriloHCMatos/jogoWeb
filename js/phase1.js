window.phaseOneDefinition = {
  title: "Fase 1",
  subStages: [
    {
      name: "A Queda da Bastilha",
      subtitle: "14 de julho de 1789",
      objective: "Invada a prisão, derrote os guardas e liberte 2 prisioneiros.",
      timeLimit: 220,
      playerSpawn: { x: 84, y: 440 },
      palette: { floor: "#312e81", accent: "#1d4ed8", line: "#fbbf24" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 512, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 932, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 260, y: 80, width: 22, height: 220, color: "#57534e" },
        { x: 420, y: 220, width: 22, height: 220, color: "#57534e" },
        { x: 600, y: 80, width: 22, height: 240, color: "#57534e" }
      ],
      enemies: [
        { x: 300, y: 180, radius: 14, speed: 60, maxHp: 40, hp: 40, color: "#93c5fd", name: "Guarda Real", ai: "chaser", meleeDamage: 8, sprite: "royalGuard", lootTable: [{ kind: "ammo", value: 4, color: "#f59e0b", label: "P" }], meta: { score: 80 } },
        { x: 508, y: 360, radius: 14, speed: 70, maxHp: 44, hp: 44, color: "#93c5fd", name: "Mosqueteiro", ai: "turret", rangedDamage: 10, sprite: "musketeer", lootTable: [{ kind: "health", value: 15, color: "#22c55e", label: "B" }], meta: { score: 100 } },
        { x: 720, y: 160, radius: 14, speed: 65, maxHp: 40, hp: 40, color: "#93c5fd", name: "Guarda da Torre", ai: "chaser", sprite: "royalGuard", meleeDamage: 10, lootTable: [{ kind: "ammo", value: 3, color: "#f59e0b", label: "P" }], meta: { score: 90 } }
      ],
      npcs: [
        {
          x: 788,
          y: 418,
          radius: 14,
          color: "#e5e7eb",
          name: "Prisioneiro 1",
          sprite: "prisoner",
          dialogueId: "prisonerOne",
          meta: {
            onTalk(game) {
              if (!game.flags.prisonerOneFreed) {
                game.flags.prisonerOneFreed = true;
                game.player.rescued += 1;
                game.player.score += 100;
              }
            }
          }
        },
        {
          x: 860,
          y: 122,
          radius: 14,
          color: "#e5e7eb",
          name: "Prisioneiro 2",
          sprite: "prisoner",
          dialogueId: "prisonerTwo",
          meta: {
            onTalk(game) {
              if (!game.flags.prisonerTwoFreed) {
                game.flags.prisonerTwoFreed = true;
                game.player.rescued += 1;
                game.player.score += 100;
              }
            }
          }
        }
      ],
      pickups: [
        { x: 160, y: 120, kind: "ammo", value: 4, color: "#f59e0b", label: "P" },
        { x: 650, y: 420, kind: "health", value: 15, color: "#22c55e", label: "B" }
      ],
      dialogues: {
        prisonerOne: {
          start: 0,
          nodes: [
            { speaker: "Prisioneiro 1", text: "Você realmente veio? A Bastilha está caindo?" },
            { speaker: "Cidadão Revolucionário", text: "Sim. Saia daqui e conte a todos que o povo já não teme as grades." }
          ]
        },
        prisonerTwo: {
          start: 0,
          nodes: [
            { speaker: "Prisioneiro 2", text: "Não me abandone. A liberdade ainda existe?" },
            { speaker: "Cidadão Revolucionário", text: "Existe enquanto lutarmos por ela. Corra para a praça e viva para testemunhar a mudança." }
          ]
        }
      },
      onStart(game) {
        game.dialogue.open({
          start: 0,
          nodes: [
            { speaker: "Narrador", text: "A Bastilha não é apenas uma prisão; é o símbolo do medo absolutista. Aprenda a lutar e liberte quem ainda está acorrentado." }
          ]
        });
      },
      onUpdate(game) {
        if (game.player.rescued >= 2 && game.enemies.length === 0) game.nextStage();
      }
    },
    {
      name: "Declaração dos Direitos",
      subtitle: "Liberdade, Igualdade, Fraternidade",
      objective: "Converse com os NPCs do hub e defina o tom da sua revolução.",
      timeLimit: 240,
      playerSpawn: { x: 180, y: 270 },
      palette: { floor: "#14532d", accent: "#166534", line: "#bef264" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 512, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 932, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 340, y: 150, width: 260, height: 26, color: "#57534e" },
        { x: 340, y: 350, width: 260, height: 26, color: "#57534e" }
      ],
      enemies: [],
      npcs: [
        { x: 420, y: 250, radius: 16, color: "#fcd34d", name: "Orador Popular", sprite: "orator", dialogueId: "rightsSpeaker", meta: { onTalk(game) { game.flags.rightsSpeakerTalked = true; } } },
        { x: 620, y: 250, radius: 16, color: "#fca5a5", name: "Costureira Cívica", sprite: "seamstress", dialogueId: "seamstress", meta: { onTalk(game) { game.flags.seamstressTalked = true; } } }
      ],
      pickups: [{ x: 540, y: 430, kind: "score", value: 50, color: "#38bdf8", label: "XP" }],
      dialogues: {
        rightsSpeaker: {
          start: 0,
          nodes: [
            { speaker: "Orador Popular", text: "A revolução precisa de mais que pólvora. O que você protegerá primeiro?" },
            {
              speaker: "Orador Popular",
              text: "Escolha como sua reputação será lembrada.",
              choices: [
                { text: "Poupar civis e buscar justiça", next: 2, effect: () => { window.frenchRevolutionGame.player.choices.mercy += 1; } },
                { text: "Disciplina e ordem acima de tudo", next: 3, effect: () => { window.frenchRevolutionGame.player.choices.discipline += 1; } }
              ]
            },
            { speaker: "Cidadão Revolucionário", text: "Sem o povo vivo, não existe nação. Lutarei sem esquecer por quem luto." },
            { speaker: "Cidadão Revolucionário", text: "Sem ordem, a revolução se devora. Serei firme, mesmo quando doer." }
          ]
        },
        seamstress: {
          start: 0,
          nodes: [
            { speaker: "Costureira Cívica", text: "Liberdade não cabe apenas em decretos; ela vive nas ruas, na comida repartida e no medo vencido." },
            { speaker: "Cidadão Revolucionário", text: "Então cada batalha deve lembrar as pessoas comuns, não apenas os nomes dos grandes homens." }
          ]
        }
      },
      onUpdate(game) {
        if (game.flags.rightsSpeakerTalked && game.flags.seamstressTalked) game.nextStage();
      }
    },
    {
      name: "Fuga de Varennes",
      subtitle: "Intercepte a carruagem real",
      objective: "Corra contra o tempo e capture Luís XVI antes que ele escape.",
      timeLimit: 120,
      playerSpawn: { x: 120, y: 260 },
      palette: { floor: "#4c1d95", accent: "#6d28d9", line: "#fca5a5" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#312e81" },
        { x: 0, y: 512, width: 960, height: 28, color: "#312e81" },
        { x: 0, y: 0, width: 28, height: 540, color: "#312e81" },
        { x: 932, y: 0, width: 28, height: 540, color: "#312e81" },
        { x: 240, y: 110, width: 40, height: 320, color: "#6b7280" },
        { x: 470, y: 40, width: 40, height: 250, color: "#6b7280" },
        { x: 680, y: 180, width: 40, height: 280, color: "#6b7280" }
      ],
      enemies: [
        { x: 820, y: 260, radius: 18, speed: 92, maxHp: 120, hp: 120, color: "#60a5fa", name: "Luís XVI", ai: "patrol", sprite: "louis", meleeDamage: 6, meta: { score: 250 } },
        { x: 560, y: 140, radius: 14, speed: 88, maxHp: 46, hp: 46, color: "#fda4af", name: "Escolta Real", ai: "chaser", meleeDamage: 12, sprite: "royalist", meta: { score: 80 } },
        { x: 570, y: 380, radius: 14, speed: 88, maxHp: 46, hp: 46, color: "#fda4af", name: "Escolta Real", ai: "chaser", meleeDamage: 12, sprite: "royalist", meta: { score: 80 } }
      ],
      npcs: [],
      pickups: [{ x: 350, y: 80, kind: "ammo", value: 4, color: "#f59e0b", label: "P" }],
      dialogues: {},
      onStart(game) {
        game.dialogue.open({
          start: 0,
          nodes: [
            { speaker: "Narrador", text: "A monarquia tenta escapar. Corra, desvie dos bloqueios e detenha o rei antes que sua fuga mude o rumo da Revolução." }
          ]
        });
      },
      onEnemyDefeated(game, enemy) {
        if (enemy.name === "Luís XVI") game.nextStage();
      }
    }
  ]
};
