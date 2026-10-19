# Máquina de Urso 🧸

Jogo de máquina de pegar pelúcia, mobile first, com neon animado, sons sintetizados e comemoração.
Feito para diversão em família — sem fins comerciais.

Os personagens são fan art desenhada em código (canvas), sem sprites ou músicas oficiais.

## Rodar local

```bash
npm install
npm run dev      # abre em http://localhost:5173 e na rede local (pra testar no celular)
```

## Build / deploy

```bash
npm run build    # gera dist/
```

Na Vercel: framework **Vite**, build `npm run build`, output `dist`.

## PWA

Instalável e funciona offline depois da primeira visita (service worker via `vite-plugin-pwa`).
No iPhone: Safari → Compartilhar → **Adicionar à Tela de Início**. No Android: menu do Chrome → **Instalar app**.

## Controles

- ◀ ▶ (segurar) move a garra — ou setas do teclado
- **PEGAR** desce a garra — ou espaço/Enter

> No iPhone, o som não toca com a chave de silencioso ligada.
