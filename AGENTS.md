# AGENTS.md — Máquina de Urso

Jogo de máquina de pelúcia (Vite + TypeScript, sem framework). Mobile first, para criança.

## Design system: anticaos

A **interface** (HUD, menus, ranking, tela inicial, campo de nome) segue o anticaos.
Leia as regras em `../anticaos-ui/AGENTS.md` antes de mexer nela.

- Tokens: `src/anticaos/tokens.css`, **gerado** por `node scripts/sync-anticaos.mjs` a partir de
  `../anticaos-ui`. Não edite à mão; rode o script quando o anticaos mudar.
- No `src/style.css`, use só `var(--token)`: cor (`--foreground`, `--secondary`, `--primary`,
  `--warning`…), tamanho (`--text-*`), raio (`--radius-*`), sombra, `--z-*`, `--duration-*`, `--ease-*`.
  Espaço em múltiplos de `--spacing`.
- Fontes: `--font-sans` (Geist) no texto, `--font-pixel` (Geist Pixel Square) em títulos, placar
  e letreiro. Ficam em `public/fonts` e entram no precache do PWA.
- Painéis flutuam sobre o jogo, então usam vidro (`--glass-bg`, `--blur-glass`, `--shadow-glass`).
- O jogo é sempre escuro (`<html class="dark">`).
- Botões precisam ser grandes o bastante para dedo de criança: não use a densidade compacta.

## Fora do design system: ilustração

A máquina e tudo que imita objeto físico têm cor própria e **não** seguem os tokens:
canvas (`main.ts`, `characters.ts`, `backgrounds.ts`), neon, alavanca, botão PEGAR e a
comemoração de vitória. No CSS, esses trechos estão marcados com o comentário `ilustração`.

## Antes de entregar

`npm run build` (roda `tsc` e o build do Vite). Não faça merge nem deploy sem pedido.
