window.phaseTwoDefinition = {
  title: "Fase 2",
  subStages: [
    {
      name: "A Guilhotina",
      subtitle: "Da monarquia à República",
      objective: "Atravesse a praça e testemunhe a ruptura histórica.",
      timeLimit: 160,
      playerSpawn: { x: 120, y: 280 },
      palette: { floor: "#3f1d1d", accent: "#7f1d1d", line: "#fca5a5" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 512, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 932, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 420, y: 170, width: 120, height: 200, color: "#78350f" }
      ],
      enemies: [],
      npcs: [
        { x: 470, y: 220, radius: 16, color: "#60a5fa", name: "Luís XVI", sprite: "louis", dialogueId: "kingLastWords" },
        { x: 510, y: 320, radius: 16, color: "#f9a8d4", name: "Maria Antonieta", sprite: "marie", dialogueId: "queenLastWords" }
      ],
      pickups: [],
      dialogues: {
        kingLastWords: {
          start: 0,
          nodes: [
            { speaker: "Luís XVI", text: "Que meu fim sirva ao menos de lição para um reino que não ouviu seus próprios famintos." },
            { speaker: "Narrador", text: "A praça silencia. A República nasce em meio ao peso irreversível da execução." }
          ]
        },
        queenLastWords: {
          start: 0,
          nodes: [
            { speaker: "Maria Antonieta", text: "As coroas caem mais rápido que os impérios imaginam." },
            { speaker: "Narrador", text: "Não há retorno. A política agora se alimenta de urgência, virtude e sangue." }
          ]
        }
      },
      onUpdate(game) {
        if (!game.flags.phase2CutsceneDone) {
          game.flags.phase2CutsceneDone = true;
          game.dialogue.open({
            start: 0,
            nodes: [
              { speaker: "Narrador", text: "1792 e 1793 condensam esperança e horror. O rei e a rainha perdem a coroa; a República exige sobrevivência num mundo em guerra." }
            ]
          }, () => game.nextStage());
        }
      }
    },
    {
      name: "Comitê de Salvação Pública",
      subtitle: "Defenda a barricada",
      objective: "Sobreviva às ondas de invasores e preserve a posição revolucionária.",
      timeLimit: 180,
      playerSpawn: { x: 210, y: 280 },
      palette: { floor: "#1f2937", accent: "#374151", line: "#f97316" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 512, width: 960, height: 28, color: "#44403c" },
        { x: 0, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 932, y: 0, width: 28, height: 540, color: "#44403c" },
        { x: 340, y: 150, width: 280, height: 20, color: "#92400e" },
        { x: 340, y: 370, width: 280, height: 20, color: "#92400e" },
        { x: 580, y: 170, width: 22, height: 200, color: "#92400e" }
      ],
      enemies: [
        { x: 760, y: 120, radius: 14, speed: 90, maxHp: 60, hp: 60, color: "#cbd5e1", name: "Soldado Externo", ai: "chaser", meleeDamage: 12, sprite: "royalist", lootTable: [{ kind: "ammo", value: 3, color: "#f59e0b", label: "P" }], meta: { score: 120 } },
        { x: 820, y: 260, radius: 14, speed: 94, maxHp: 52, hp: 52, color: "#fca5a5", name: "Monarquista Armado", ai: "turret", rangedDamage: 14, sprite: "royalist", lootTable: [{ kind: "health", value: 12, color: "#22c55e", label: "B" }], meta: { score: 140 } },
        { x: 780, y: 420, radius: 14, speed: 90, maxHp: 60, hp: 60, color: "#cbd5e1", name: "Soldado Externo", ai: "chaser", meleeDamage: 12, sprite: "royalist", lootTable: [{ kind: "ammo", value: 3, color: "#f59e0b", label: "P" }], meta: { score: 120 } }
      ],
      npcs: [],
      pickups: [{ x: 110, y: 280, kind: "health", value: 15, color: "#22c55e", label: "B" }],
      dialogues: {},
      onUpdate(game) {
        if (!game.flags.committeeWave2 && game.stageTimer < 110) {
          game.flags.committeeWave2 = true;
          game.enemies.push(
            { x: 860, y: 100, radius: 14, speed: 102, maxHp: 58, hp: 58, color: "#fca5a5", name: "Agente Infiltrado", ai: "chaser", meleeDamage: 16, sprite: "royalist", meta: { score: 160 } },
            { x: 860, y: 430, radius: 14, speed: 102, maxHp: 58, hp: 58, color: "#fca5a5", name: "Agente Infiltrado", ai: "chaser", sprite: "royalist", meleeDamage: 16, meta: { score: 160 } }
          );
        }
        if (game.enemies.length === 0 && game.stageTimer < 140) game.nextStage();
      }
    },
    {
      name: "O Grande Terror",
      subtitle: "Poupe os civis, sobreviva ao medo",
      objective: "Atravesse o bairro sem atingir civis e com recursos escassos.",
      timeLimit: 150,
      playerSpawn: { x: 100, y: 420 },
      palette: { floor: "#111827", accent: "#030712", line: "#ef4444" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#111827" },
        { x: 0, y: 512, width: 960, height: 28, color: "#111827" },
        { x: 0, y: 0, width: 28, height: 540, color: "#111827" },
        { x: 932, y: 0, width: 28, height: 540, color: "#111827" },
        { x: 260, y: 80, width: 30, height: 220, color: "#1f2937" },
        { x: 500, y: 220, width: 30, height: 220, color: "#1f2937" },
        { x: 710, y: 80, width: 30, height: 220, color: "#1f2937" }
      ],
      enemies: [
        { x: 350, y: 140, radius: 14, speed: 118, maxHp: 58, hp: 58, color: "#ef4444", name: "Guarda Jacobino", ai: "chaser", sprite: "jacobin", meleeDamage: 18, meta: { score: 150 } },
        { x: 650, y: 430, radius: 14, speed: 118, maxHp: 58, hp: 58, color: "#ef4444", name: "Guarda Jacobino", ai: "turret", sprite: "jacobin", rangedDamage: 16, meta: { score: 150 } }
      ],
      npcs: [
        { x: 430, y: 380, radius: 12, color: "#e5e7eb", name: "Civil Amedrontado", sprite: "civilian", dialogueId: "civilTerror" },
        { x: 800, y: 120, radius: 12, color: "#e5e7eb", name: "Civil Ferido", sprite: "civilian", dialogueId: "civilWounded" }
      ],
      pickups: [
        { x: 180, y: 120, kind: "ammo", value: 2, color: "#f59e0b", label: "P" },
        { x: 820, y: 420, kind: "health", value: 10, color: "#22c55e", label: "B" }
      ],
      dialogues: {
        civilTerror: {
          start: 0,
          nodes: [
            { speaker: "Civil Amedrontado", text: "Hoje qualquer palavra errada parece sentença. A revolução ainda reconhece seus filhos?" },
            { speaker: "Cidadão Revolucionário", text: "Se esquecermos de proteger os inocentes, estaremos defendendo apenas o medo com outra bandeira." }
          ]
        },
        civilWounded: {
          start: 0,
          nodes: [
            { speaker: "Civil Ferido", text: "Não desperdice munição em desespero. Os tiros também escolhem destinos." },
            { speaker: "Cidadão Revolucionário", text: "Então cada disparo terá peso. Vou sair daqui sem transformar civis em alvo." }
          ]
        }
      },
      onStart(game) {
        game.player.ammo = Math.min(game.player.ammo, 6);
      },
      onUpdate(game) {
        const harmedCivil = game.projectiles.some((p) => p.owner === "player" && game.npcs.some((n) => Math.hypot(p.x - n.x, p.y - n.y) <= p.r + n.radius));
        if (harmedCivil) return game.failStage("Um civil foi atingido em meio ao pânico. A missão fracassou moral e politicamente.");
        if (game.player.x > 860 && game.enemies.length === 0) game.nextStage();
      }
    },
    {
      name: "Reação Termidoriana",
      subtitle: "Boss Fight: Robespierre",
      objective: "Derrote Robespierre e seus guardas de elite.",
      timeLimit: 190,
      playerSpawn: { x: 120, y: 260 },
      palette: { floor: "#3f3f46", accent: "#18181b", line: "#facc15" },
      walls: [
        { x: 0, y: 0, width: 960, height: 28, color: "#27272a" },
        { x: 0, y: 512, width: 960, height: 28, color: "#27272a" },
        { x: 0, y: 0, width: 28, height: 540, color: "#27272a" },
        { x: 932, y: 0, width: 28, height: 540, color: "#27272a" },
        { x: 430, y: 120, width: 22, height: 300, color: "#52525b" },
        { x: 650, y: 120, width: 22, height: 300, color: "#52525b" }
      ],
      enemies: [
        { x: 760, y: 260, radius: 18, speed: 106, maxHp: 220, hp: 220, color: "#86efac", name: "Robespierre", ai: "turret", rangedDamage: 18, sprite: "robespierre", meta: { score: 450 } },
        { x: 720, y: 160, radius: 14, speed: 104, maxHp: 78, hp: 78, color: "#fef08a", name: "Guarda de Elite", ai: "chaser", sprite: "eliteGuard", meleeDamage: 16, meta: { score: 180 } },
        { x: 720, y: 360, radius: 14, speed: 104, maxHp: 78, hp: 78, color: "#fef08a", name: "Guarda de Elite", ai: "chaser", sprite: "eliteGuard", meleeDamage: 16, meta: { score: 180 } }
      ],
      npcs: [],
      pickups: [
        { x: 220, y: 160, kind: "ammo", value: 5, color: "#f59e0b", label: "P" },
        { x: 220, y: 370, kind: "health", value: 20, color: "#22c55e", label: "B" }
      ],
      dialogues: {},
      onStart(game) {
        game.dialogue.open({
          start: 0,
          nodes: [
            { speaker: "Robespierre", text: "Sem virtude, o terror é funesto. Sem terror, a virtude é impotente. Venha provar qual dos dois ainda governa Paris." }
          ]
        });
      },
      onEnemyDefeated(game, enemy) {
        if (enemy.name === "Robespierre") game.nextStage();
      }
    }
  ]
};
