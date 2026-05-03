window.phaseThreeDefinition = {
  title: "Fase 3",
  subStages: [
    {
      name: "O Diretório",
      subtitle: "Corrupção, fome e armadilhas",
      objective: "Atravesse os corredores instáveis com poucos recursos e alta pressão.",
      timeLimit: 120,
      playerSpawn: { x: 100, y: 430 },
      palette: { floor: "#0f766e", accent: "#115e59", line: "#fbbf24" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#134e4a" },
        { x: 0, y: 512, width: 960, height: 28, color: "#134e4a" },
        { x: 0, y: 0, width: 28, height: 540, color: "#134e4a" },
        { x: 932, y: 0, width: 28, height: 540, color: "#134e4a" },
        { x: 220, y: 80, width: 26, height: 280, color: "#0f766e" },
        { x: 430, y: 180, width: 26, height: 280, color: "#0f766e" },
        { x: 640, y: 80, width: 26, height: 280, color: "#0f766e" }
      ],
      enemies: [
        { x: 310, y: 420, radius: 14, speed: 120, maxHp: 62, hp: 62, color: "#fca5a5", name: "Mercenário do Diretório", ai: "chaser", sprite: "mercenary", meleeDamage: 18, meta: { score: 150 } },
        { x: 730, y: 120, radius: 14, speed: 124, maxHp: 62, hp: 62, color: "#c4b5fd", name: "Mercenário do Diretório", ai: "turret", sprite: "mercenary", rangedDamage: 16, meta: { score: 150 } }
      ],
      npcs: [],
      pickups: [{ x: 820, y: 420, kind: "ammo", value: 2, color: "#f59e0b", label: "P" }],
      dialogues: {},
      onStart(game) {
        game.player.ammo = Math.min(game.player.ammo, 5);
      },
      onUpdate(game) {
        const traps = [
          { x: 150, y: 140, width: 40, height: 40 },
          { x: 520, y: 80, width: 40, height: 40 },
          { x: 780, y: 280, width: 40, height: 40 }
        ];
        traps.forEach((t) => {
          if (game.player.x > t.x && game.player.x < t.x + t.width && game.player.y > t.y && game.player.y < t.y + t.height) {
            game.damagePlayer(20);
          }
        });
        if (game.player.x > 880 && game.enemies.length === 0) game.nextStage();
      }
    },
    {
      name: "Instabilidade Política",
      subtitle: "Guerra civil em duas frentes",
      objective: "Derrote radicais e monarquistas ao mesmo tempo.",
      timeLimit: 135,
      playerSpawn: { x: 470, y: 260 },
      palette: { floor: "#1e293b", accent: "#334155", line: "#eab308" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#1e293b" },
        { x: 0, y: 512, width: 960, height: 28, color: "#1e293b" },
        { x: 0, y: 0, width: 28, height: 540, color: "#1e293b" },
        { x: 932, y: 0, width: 28, height: 540, color: "#1e293b" },
        { x: 460, y: 100, width: 40, height: 120, color: "#475569" },
        { x: 460, y: 320, width: 40, height: 120, color: "#475569" }
      ],
      enemies: [
        { x: 150, y: 150, radius: 14, speed: 126, maxHp: 66, hp: 66, color: "#ef4444", name: "Radical Armado", ai: "chaser", sprite: "radical", meleeDamage: 18, meta: { score: 160 } },
        { x: 820, y: 150, radius: 14, speed: 126, maxHp: 66, hp: 66, color: "#93c5fd", name: "Monarquista Armado", ai: "chaser", sprite: "royalist", meleeDamage: 18, meta: { score: 160 } },
        { x: 150, y: 390, radius: 14, speed: 126, maxHp: 66, hp: 66, color: "#ef4444", name: "Radical Armado", ai: "turret", sprite: "radical", rangedDamage: 18, meta: { score: 160 } },
        { x: 820, y: 390, radius: 14, speed: 126, maxHp: 66, hp: 66, color: "#93c5fd", name: "Monarquista Armado", ai: "turret", sprite: "royalist", rangedDamage: 18, meta: { score: 160 } }
      ],
      npcs: [],
      pickups: [
        { x: 470, y: 80, kind: "health", value: 12, color: "#22c55e", label: "B" },
        { x: 470, y: 460, kind: "ammo", value: 3, color: "#f59e0b", label: "P" }
      ],
      dialogues: {},
      onUpdate(game) {
        if (!game.flags.instabilityReinforcements && game.stageTimer < 80) {
          game.flags.instabilityReinforcements = true;
          game.enemies.push(
            { x: 100, y: 260, radius: 14, speed: 132, maxHp: 70, hp: 70, color: "#ef4444", name: "Radical Veterano", ai: "chaser", sprite: "radical", meleeDamage: 20, meta: { score: 180 } },
            { x: 860, y: 260, radius: 14, speed: 132, maxHp: 70, hp: 70, color: "#93c5fd", name: "Monarquista Veterano", ai: "chaser", sprite: "royalist", meleeDamage: 20, meta: { score: 180 } }
          );
        }
        if (game.enemies.length === 0) game.nextStage();
      }
    },
    {
      name: "18 de Brumário",
      subtitle: "Abra caminho para Napoleão",
      objective: "Limpe o conselho e acompanhe o avanço de Napoleão até a tribuna.",
      timeLimit: 130,
      playerSpawn: { x: 120, y: 260 },
      palette: { floor: "#581c87", accent: "#6b21a8", line: "#fcd34d" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#3b0764" },
        { x: 0, y: 512, width: 960, height: 28, color: "#3b0764" },
        { x: 0, y: 0, width: 28, height: 540, color: "#3b0764" },
        { x: 932, y: 0, width: 28, height: 540, color: "#3b0764" },
        { x: 300, y: 120, width: 26, height: 300, color: "#7e22ce" },
        { x: 600, y: 120, width: 26, height: 300, color: "#7e22ce" }
      ],
      enemies: [
        { x: 430, y: 150, radius: 14, speed: 135, maxHp: 70, hp: 70, color: "#fb7185", name: "Defensor do Conselho", ai: "chaser", sprite: "councilGuard", meleeDamage: 20, meta: { score: 180 } },
        { x: 740, y: 390, radius: 14, speed: 135, maxHp: 70, hp: 70, color: "#fb7185", name: "Defensor do Conselho", ai: "turret", sprite: "councilGuard", rangedDamage: 18, meta: { score: 180 } }
      ],
      npcs: [
        { x: 220, y: 260, radius: 16, color: "#93c5fd", name: "Napoleão", sprite: "napoleon", dialogueId: "napoleonAdvance", meta: { onTalk(game) { game.flags.napoleonTalked = true; } } }
      ],
      pickups: [
        { x: 520, y: 260, kind: "ammo", value: 4, color: "#f59e0b", label: "P" },
        { x: 820, y: 260, kind: "health", value: 15, color: "#22c55e", label: "B" }
      ],
      dialogues: {
        napoleonAdvance: {
          start: 0,
          nodes: [
            { speaker: "Napoleão", text: "Abra caminho. A República está cansada, e eu ofereço ordem onde só restou fadiga." },
            { speaker: "Cidadão Revolucionário", text: "Ordem pode ser salvação ou nova prisão. Ainda assim, hoje marcharemos juntos." }
          ]
        }
      },
      onUpdate(game) {
        if (game.flags.napoleonTalked && game.enemies.length === 0 && game.player.x > 830) game.nextStage();
      }
    },
    {
      name: "O Consulado",
      subtitle: "Fim da campanha",
      objective: "Assista ao encerramento histórico.",
      timeLimit: 999,
      playerSpawn: { x: 120, y: 260 },
      palette: { floor: "#78350f", accent: "#92400e", line: "#fef3c7" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#78350f" },
        { x: 0, y: 512, width: 960, height: 28, color: "#78350f" },
        { x: 0, y: 0, width: 28, height: 540, color: "#78350f" },
        { x: 932, y: 0, width: 28, height: 540, color: "#78350f" }
      ],
      enemies: [],
      npcs: [
        { x: 540, y: 260, radius: 16, color: "#93c5fd", name: "Napoleão", sprite: "napoleon", dialogueId: "finalNapoleon" }
      ],
      pickups: [],
      dialogues: {
        finalNapoleon: {
          start: 0,
          nodes: [
            { speaker: "Napoleão", text: "A Revolução destruiu tronos e devorou seus próprios arquitetos. Agora eu assumo o leme: primeiro o Consulado, depois o Império." },
            { speaker: "Narrador", text: "O ciclo fecha-se com outra forma de poder. A França muda outra vez, e suas escolhas permanecem gravadas nas ruas que sobreviveram." }
          ]
        }
      },
      onUpdate(game) {
        if (!game.flags.finalSceneStarted) {
          game.flags.finalSceneStarted = true;
          game.dialogue.open(game.stage.dialogues.finalNapoleon, () => game.finishGame());
        }
      }
    }
  ]
};
