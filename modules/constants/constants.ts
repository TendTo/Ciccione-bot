export const rulesJester =
  `\`\`\`Per giocare la modalità jester si applicano le seguenti regole:
All'inizio della partita un giocatore a caso presente nella chat vocale sarà nominato jester attraverso un messaggio in privato

Se il jester è un impostore, non accade nulla e la partita si svolge normalmente.
Se il jester è un crewman, da quel momento in poi cambia il suo ruolo e diviene un jester.

Il jester ha le stesse abilità dei crewman, ma una win condition diversa. Non ha alcun obbligo particolare e può fare quello che vuole

CONDIZIONI DI VITTORIA:
impostori: uccidere abbastanza persone o concludere un sabotaggio
crewman: buttare fuori tutti gli impostori (ma non il jester) o concludere le task eccetto l'ultima barra. Una volta raggiunta questa soglia, bisogna utilizzare un emergency meeting per determinare se tutte le task ad eccezione di quelle del jester sono state svolte. Il jester, se presente, darà la conferma
jester: venire buttato fuori da una votazione\`\`\``;

export const garticPhone = `:telephone: Modalità Gartic Phone :telephone:
\`\`\`yaml
1: Normale
2: Replica
3: Animazione
4: Rompighiaccio
5: Combinazioni
6: Speedrun
7: Sandwich
8: Multi
9: Sfondo
\`\`\``;
