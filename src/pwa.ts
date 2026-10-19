// Service worker: quando sai versão nova, mostra o botão "atualizar"
// em vez de trocar sozinho no meio de uma partida.
import { registerSW } from 'virtual:pwa-register';

const btn = document.getElementById('update') as HTMLButtonElement;

const updateSW = registerSW({
  onNeedRefresh() {
    btn.classList.remove('hidden');
  },
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    // app instalado fica aberto por dias: confere de hora em hora e ao voltar pro app
    setInterval(() => reg.update(), 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update();
    });
  },
});

btn.addEventListener('click', () => {
  btn.disabled = true;
  btn.textContent = 'atualizando…';
  updateSW(true);
  // se não houver service worker esperando, só recarrega
  setTimeout(() => location.reload(), 3000);
});
