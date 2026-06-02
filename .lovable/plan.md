## Mano emoji animata sopra i QR

### Comportamento
- Una sola mano 👇 (96px) visibile da `md` in su (come i due QR).
- Si posiziona **sopra** il riquadro bianco del QR, centrata orizzontalmente, senza coprirlo (offset verticale che la tiene fuori dal bianco anche al picco basso del bounce).
- Bounce verticale continuo (~1s per ciclo) con leggero scale 1.0 ↔ 1.15.
- Ogni ~2.5s si sposta sull'altro QR con una transizione fade-out → cambio posizione → fade-in (no slide orizzontale attraverso lo schermo, per evitare di passare sopra la leaderboard).
- Loop infinito L → R → L.
- Drop-shadow dorato morbido per staccarla dallo sfondo teal.

### Implementazione in `src/routes/index.tsx`
- Aggiungere stato `pointerSide: 'left' | 'right'` con `useEffect` + `setInterval(2500ms)` che alterna.
- Aggiungere un nuovo elemento `<div>` fisso, `hidden md:block`, con `transition-all duration-500` su `left`/`right` e `opacity`.
- Posizione: `bottom: calc(6 + 200 + ~24px gap)` → circa `bottom-[15.5rem]`, allineato sopra il centro del QR attivo (`left-[calc(1.5rem+100px)]` o speculare a destra). Calcolato per restare fuori dal box bianco del QR.
- Contenuto: `<span>👇</span>` con `font-size: 96px`, `filter: drop-shadow(0 4px 12px var(--gold))`.
- Animazione bounce: definire keyframe `pointer-bounce` in `src/styles.css`:
  ```css
  @keyframes pointer-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-14px) scale(1.15); }
  }
  .pointer-bounce { animation: pointer-bounce 1s ease-in-out infinite; }
  ```
- Solo in modalità `leaderboard` (rispetta il wrapper di opacità esistente come i QR).

### Note
- Nessuna modifica ai due QR esistenti.
- Nessuna libreria animazione esterna: keyframe CSS + transition Tailwind sono sufficienti.
- Mobile (`< md`): la mano resta nascosta (come il QR sinistro); il QR destro mobile non avrà puntatore per non rubare spazio.
