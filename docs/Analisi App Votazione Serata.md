# **Documento di Analisi — App Generica per Serate Votazioni a Tema**

## **1\. Obiettivo**

Realizzare un'applicazione web da usare durante serate a tema con amici, in cui più prodotti o opzioni (es. pizze surgelate, birre artigianali, vini, panettoni, film, giochi da tavolo) vengono valutati dai partecipanti su diverse categorie configurabili, con generazione automatica di un report finale (classifica, medie pesate, vincitore).

L'applicazione **NON è legata a un tema specifico**: è un motore di voto generico e riutilizzabile. La struttura dati, le scale di voto e l'interfaccia di amministrazione permettono di configurare da zero un qualsiasi evento a tema direttamente dal pannello admin, senza mai modificare il codice sorgente dell'app.

## **2\. Contesto e vincoli**

* **Hosting**: locale, sul Mac mini di casa. Nessun deploy cloud richiesto.  
* **Rete**: tutti i dispositivi (Mac mini, TV, smartphone degli ospiti) sono connessi alla stessa rete WiFi domestica.  
* **Accesso client**: browser mobile (nessuna app nativa da installare). Si accede a un indirizzo tipo http://192.168.x.x:PORT o via nome mDNS (http://nomemac.local:PORT).  
* **Autenticazione**: nessuna autenticazione complessa. Ogni partecipante inserisce solo un **username** (nickname) per identificarsi durante la sessione. Nessuna password, nessuna gestione utenti persistente tra serate.  
* **Numero utenti**: piccolo gruppo di amici (indicativamente **10 \- max 20 persone**). Questo dimensionamento consente di ottimizzare le UI per mostrare nominativi espliciti anziché dati aggregati anonimi.  
* **Persistenza**: i dati di ogni serata devono essere salvati in locale su database relazionale leggero (SQLite) per poter rivedere lo storico dei risultati anche a distanza di tempo.

## **3\. Filosofia di Design e Dispositivi Target**

Per garantire un'esperienza utente impeccabile e massimizzare la fluidità percepita, l'applicazione si divide in tre interfacce distinte, ciascuna progettata per un dispositivo e un ruolo specifico:

### **3.1 Mobile-First UI (Smartphone Votanti)**

* **Target**: Browser web su iOS/Android in verticale.  
* **Obiettivo**: Estrema fluidità, accessibilità e usabilità ad una sola mano (mentre l'altra regge un bicchiere o una fetta di cibo).  
* **Linee guida**:  
  * Elementi interattivi di grandi dimensioni (target di tocco minimi di ![][image1]).  
  * Slider tattili continui o selettori a bolle per i voti, con feedback visivo istantaneo sul cambio di valore.  
  * Assenza di input testuali durante la fase di voto (tutto avviene tramite tap e swipe).  
  * Gestione fluida degli stati di caricamento e invio con transizioni animate non bloccanti.

### **3.2 Desktop UI (Admin Laptop)**

* **Target**: Schermi notebook o desktop (da ![][image2] in su).  
* **Obiettivo**: Massima densità informativa e controllo totale sul flusso della serata.  
* **Linee guida**:  
  * Layout multi-colonna per visualizzare contemporaneamente l'elenco dei prodotti, lo stato dei votanti attivi e le azioni rapide di controllo.  
  * Scorciatoie da tastiera e pulsanti d'azione rapidi per non rallentare il ritmo della serata.  
  * Monitoraggio real-time granulare (chi è online, chi ha votato, chi è in ritardo).

### **3.3 Cinema-Display UI (Reporter TV 4K)**

* **Target**: Schermi TV di grandi dimensioni (![][image3] \- ![][image4]) a risoluzione ![][image5] UHD, visualizzati a ![][image6] di distanza dal divano.  
* **Obiettivo**: Spettacolarizzazione dei risultati, leggibilità estrema e impatto cinematico.  
* **Linee guida**:  
  * Tema scuro profondo (Deep Black / Midnight Navy) con accenti di colore luminosi e brillanti (neon glow) per un effetto "Game Show".  
  * Font scalati appositamente per la visualizzazione a distanza (titoli enormi, testi di supporto nitidi).  
  * Animazioni fluide e accelerate via hardware (![][image7]) per i grafici a barre in tempo reale e per lo svelamento delle schede (flip cards).  
  * Integrazione acustica opzionale per effetti sonori e per la narrazione dei testi (voce fuori campo).

## **4\. Ruoli utente**

### **4.1 Admin (host della serata)**

* Crea e configura l'evento prima che inizi (scelta del tema, inserimento categorie e prodotti).  
* Definisce le categorie di voto e per ciascuna la scala (1-5 o 1-10) e il peso relativo.  
* Decide se il voto è **alla cieca** (blind test: marca/nome reali nascosti) o **palese**.  
* Gestisce le fasi di voto (apre/chiude i singoli prodotti).  
* Visualizza il report finale e invia il comando di "Reveal" per svelare i nomi reali.  
* Può aggiungere prodotti last-minute se necessario.

### **4.2 Partecipante (Smartphone)**

* Accede inserendo il proprio username registrato.  
* Visualizza solo il prodotto attualmente in fase di degustazione.  
* Vota in modo definitivo (conferma esplicita con modale) per evitare tocchi accidentali.  
* Visualizza un riepilogo in sola lettura una volta completato il voto.

### **4.3 Reporter (TV 4K)**

* Ruolo di sola visualizzazione, proiettato sulla TV del salotto.  
* Mostra in tempo reale chi sta votando (senza svelare i punteggi per non influenzare gli altri).  
* Proietta classifiche dinamiche, grafici a barre delle categorie e podi finali animati.  
* Rispetta le regole di blind: mostra solo i nomi fittizi fino al comando di Reveal dell'admin.  
* Riproduce gli annunci sonori e la voce sintetizzata del narratore virtuale.

## **5\. Architettura e Stack Tecnico Consigliato**

Per garantire una fluidità assoluta (latenza di sincronizzazione real-time ![][image8] in rete locale) e una manutenzione pari a zero sul Mac mini, lo stack consigliato è:

* **Backend**: Node.js \+ **Fastify** (molto più veloce e leggero di Express) \+ **Socket.io** per la gestione dei canali WebSocket.  
* **Database**: **SQLite** (tramite better-sqlite3 per performance ottimali sincrone sul server locale).  
* **Frontend SPA**: **Vite \+ React** (o Svelte). Svelte è particolarmente consigliato per la fluidità estrema dei componenti su vecchi smartphone o TV con browser integrati limitati.  
* **Styling**: **Tailwind CSS** per un design moderno, accoppiato a transizioni native CSS3 accelerate tramite GPU (transform e opacity) per garantire animazioni a ![][image7] stabili.  
* **Rete e mDNS**: Configurazione di Bonjour sul Mac mini per mappare il server su un nome host locale facile da ricordare (es. http://serata.local). Generazione di un QR code proiettato sulla TV all'avvio per connettere istantaneamente gli ospiti alla LAN.

## **6\. Concetti chiave del modello dati e Vincoli Rigidi**

Evento (Session)  
 ├─ nome, data, stato (setup / joining / voto\_in\_corso / chiuso)  
 ├─ modalità\_blind (bool)  
 ├─ modalità\_reveal (enum: per\_item | a\_fine\_evento)  
 ├─ Categorie\[\]  
 └─ Item\[\]

Categoria  
 ├─ nome (es. "Croccantezza", "Gusto", "Presentazione")  
 ├─ scala (enum: 1-5 | 1-10)  
 ├─ peso (numero, default 1\)  
 ├─ ordine  
 └─ attiva (bool)

Item (es. una pizza, un dolce, ecc.)  
 ├─ nome\_pubblico (es. "Prodotto A")  
 ├─ nome\_reale (es. "Buitoni Bella Napoli")  
 ├─ stato\_voto (chiuso / aperto)        
 ├─ rivelato (bool)  
 ├─ ordine  
 └─ immagine (opzionale)

Partecipante  
 ├─ username (univoco)  
 ├─ codice\_riconnessione (6 cifre)  
 └─ online (bool)

Voto  
 ├─ id\_partecipante  
 ├─ id\_item  
 ├─ id\_categoria  
 ├─ valore (int)  
 └─ timestamp

### **Vincoli di Sicurezza e Blind Test**

* **Regola del Reveal**: Un item che è stato **rivelato** (rivelato \= true) **NON può in nessun caso essere riaperto al voto**. Il bottone di riapertura viene disabilitato permanentemente per quell'item nel pannello Admin per evitare che la conoscenza della marca reale condizioni o alteri i voti.  
* **Integrità dei voti**: Un partecipante non può modificare autonomamente i propri voti una volta inviati. L'unico modo per correggere un errore è chiedere all'admin di sbloccare l'item (azione consentita solo se non è ancora stato fatto il reveal).

## **7\. Specifica di Dettaglio Tecnico (Database Schema)**

Lo schema relazionale ottimizzato per SQLite e progettato per gestire sessioni multiple (storico):

\-- SQLite Database Schema for Generic Themed Voting App

\-- 1\. Sessions table: holds the details of each voting event  
CREATE TABLE IF NOT EXISTS sessions (  
    id TEXT PRIMARY KEY,  
    name TEXT NOT NULL,  
    date TEXT NOT NULL,  
    status TEXT NOT NULL CHECK (status IN ('setup', 'joining', 'voting', 'closed')),  
    blind\_mode INTEGER NOT NULL DEFAULT 1, \-- 1 \= true, 0 \= false  
    reveal\_mode TEXT NOT NULL CHECK (reveal\_mode IN ('per\_item', 'end\_of\_event')),  
    created\_at INTEGER NOT NULL  
);

\-- 2\. Categories table: defines the voting dimensions for a session  
CREATE TABLE IF NOT EXISTS categories (  
    id TEXT PRIMARY KEY,  
    session\_id TEXT NOT NULL,  
    name TEXT NOT NULL,  
    scale TEXT NOT NULL CHECK (scale IN ('1-5', '1-10')),  
    weight REAL NOT NULL DEFAULT 1.0,  
    display\_order INTEGER NOT NULL,  
    active INTEGER NOT NULL DEFAULT 1, \-- 1 \= active, 0 \= disabled  
    FOREIGN KEY (session\_id) REFERENCES sessions(id) ON DELETE CASCADE  
);

\-- 3\. Items table: the products being evaluated  
CREATE TABLE IF NOT EXISTS items (  
    id TEXT PRIMARY KEY,  
    session\_id TEXT NOT NULL,  
    public\_name TEXT NOT NULL,  
    real\_name TEXT,  
    voting\_status TEXT NOT NULL CHECK (voting\_status IN ('closed', 'open')),  
    revealed INTEGER NOT NULL DEFAULT 0, \-- 1 \= true, 0 \= false  
    display\_order INTEGER NOT NULL,  
    image\_url TEXT,  
    FOREIGN KEY (session\_id) REFERENCES sessions(id) ON DELETE CASCADE  
);

\-- 4\. Participants table: guests invited or connected to the session  
CREATE TABLE IF NOT EXISTS participants (  
    id TEXT PRIMARY KEY,  
    session\_id TEXT NOT NULL,  
    username TEXT NOT NULL,  
    reconnection\_code TEXT NOT NULL,  
    connected INTEGER NOT NULL DEFAULT 0, \-- 1 \= online, 0 \= offline  
    FOREIGN KEY (session\_id) REFERENCES sessions(id) ON DELETE CASCADE,  
    UNIQUE(session\_id, username)  
);

\-- 5\. Votes table: records the individual evaluations  
CREATE TABLE IF NOT EXISTS votes (  
    id TEXT PRIMARY KEY,  
    participant\_id TEXT NOT NULL,  
    item\_id TEXT NOT NULL,  
    category\_id TEXT NOT NULL,  
    value INTEGER NOT NULL,  
    timestamp INTEGER NOT NULL,  
    FOREIGN KEY (participant\_id) REFERENCES participants(id) ON DELETE CASCADE,  
    FOREIGN KEY (item\_id) REFERENCES items(id) ON DELETE CASCADE,  
    FOREIGN KEY (category\_id) REFERENCES categories(id) ON DELETE CASCADE,  
    UNIQUE(participant\_id, item\_id, category\_id)  
);

## **8\. Specifiche delle API REST**

Le rotte REST destinate alle operazioni sincrone e transazionali del sistema:

### **8.1 Setup e Configurazione Sessione**

* **POST /api/sessions**  
  * *Payload*:  
    {  
      "name": "Sfida dei Panettoni Artigianali 2026",  
      "date": "2026-12-18",  
      "blind\_mode": true,  
      "reveal\_mode": "per\_item"  
    }

* **PUT /api/sessions/:id/status**  
  * *Descrizione*: Cambia lo stato globale dell'evento (setup, joining, voting, closed).

### **8.2 Anagrafica e Login Partecipanti**

* **POST /api/sessions/:id/participants**  
  * *Payload*: { "username": "Lorenzo" }  
  * *Risposta*: { "id": "part-uuid", "reconnection\_code": "510931" }  
* **POST /api/sessions/:id/auth/login**  
  * *Payload*: { "username": "Lorenzo" }  
  * *Risposta*: token JWT o cookie di sessione per l'accesso mobile.  
* **POST /api/sessions/:id/auth/reconnect**  
  * *Payload*: { "username": "Lorenzo", "reconnection\_code": "510931" }

### **8.3 Caricamento Voti**

* **POST /api/votes**  
  * *Payload*:  
    {  
      "item\_id": "item-uuid-prodotto-1",  
      "votes": \[  
        { "category\_id": "cat-uuid-aroma", "value": 9 },  
        { "category\_id": "cat-uuid-gusto", "value": 8 }  
      \]  
    }

## **9\. Canale Realtime (Protocollo WebSocket)**

Il coordinamento realtime a bassissima latenza (![][image9]) per aggiornare la TV del salotto e gli smartphone viene gestito via WebSocket.

### **9.1 Eventi Client-to-Server**

* join\_session: Associa la connessione WebSocket alla stanza dell'evento.  
  * Payload: { "sessionId": "session-uuid", "role": "admin|participant|reporter", "userId": "user-uuid" }

### **9.2 Eventi Server-to-Client**

* session\_state\_changed: Notifica a tutti i dispositivi la transizione di stato globale dell'evento.  
  * Payload: { "status": "voting" }  
* active\_item\_changed: Comunica agli smartphone l'apertura di un nuovo prodotto da degustare.  
  * Payload: { "itemId": "item-uuid-b", "public\_name": "Prodotto B" }  
* participant\_status\_update: Sincronizza admin e TV su chi ha votato l'item corrente.  
  * Payload:  
    {  
      "participants": \[  
        { "id": "part-1", "username": "Giulia", "connected": true, "has\_voted\_active\_item": true },  
        { "id": "part-2", "username": "Marco", "connected": false, "has\_voted\_active\_item": false }  
      \]  
    }

* item\_revealed: Svela l'identità reale di un item e innesca le animazioni di reveal sulla TV.  
  * Payload: { "itemId": "item-uuid-a", "real\_name": "Panettone Massari" }

## **10\. Flussi di Lavoro Dettagliati**

### **10.1 Setup e Configurazione Generica**

1. L'admin avvia l'applicazione sul Mac mini e accede da laptop.  
2. Inserisce il titolo dell'evento e configura le categorie di voto con i relativi pesi.  
3. Carica l'elenco dei prodotti, indicando per ciascuno il Nome Pubblico fittizio (es. "Prodotto Rosso") e il Nome Reale/Marca (es. "Birra Artigianale X").  
4. Registra i partecipanti attesi (10 \- max 20 persone). Il sistema assegna a ciascuno un codice univoco a 6 cifre.

### **10.2 Il Joining e l'Ingresso degli Ospiti**

1. La TV in salotto mostra una schermata di benvenuto con un grande QR code generato dinamicamente (http://serata.local).  
2. Gli ospiti inquadrano il QR code ed entrano in una pagina di login dove digitano il proprio username.  
3. Man mano che effettuano l'accesso, i loro nomi si illuminano in tempo reale sia sulla TV che sulla dashboard dell'Admin.  
4. Quando l'host vede che tutti i 10-20 partecipanti sono in sala d'attesa, clicca su "Chiudi Joining". Il gruppo è sigillato, definendo con precisione il quorum per ogni votazione.

### **10.3 Conduzione della Serata e Votazione**

1. L'host apre le votazioni sul primo prodotto.  
2. Sugli smartphone degli utenti compare istantaneamente la scheda di voto con i grandi slider tattili.  
3. Sulla TV compare una barra di progresso e l'elenco dei partecipanti: chi ha inviato il voto si illumina di verde, chi manca rimane in attesa. Nessun punteggio parziale viene svelato.  
4. Quando tutti hanno votato, l'host clicca "Chiudi Voto".  
5. A seconda della modalità impostata, l'host può scegliere di svelare subito l'identità del prodotto premendo "Reveal". La TV esegue un'animazione 3D svelando la marca reale e mostrando la media pesata dei punteggi. Il prodotto viene bloccato e non può più essere riaperto.  
6. Se un ospite perde la connessione a causa del WiFi, inserisce il suo username e il codice a 6 cifre per recuperare all'istante la sessione e tutti i voti precedentemente inseriti.

### **10.4 Podio e Classifica Finale**

1. Conclusi tutti i prodotti, l'host chiude l'evento.  
2. La TV mostra un podio tridimensionale animato a tutto schermo (dal 3° al 1° posto).  
3. Vengono evidenziati i premi speciali: il prodotto più votato in una singola categoria, il votante più severo (media voti più bassa) e quello più generoso.  
4. L'host può esportare la classifica in formato PDF/CSV o salvarla nello storico locale per le sfide future.

## **11\. MVP (Most Valuable Product) vs. Estensioni Future**

### **MVP (Primo Torneo)**

* Configurazione dinamica di sessione, categorie (scala 1-10, peso) ed elementi.  
* Database SQLite funzionante localmente.  
* Portale mobile per partecipanti con slider tattili ad alta sensibilità.  
* Pannello Admin responsive multi-colonna per laptop.  
* Schermata TV (Reporter) in Dark Mode per proiezione.  
* Gestione fase Joining per il congelamento del quorum.  
* Comunicazione WebSocket sincrona tra tutti i dispositivi.

### **Estensioni Future**

* Esportazione del report finale in PDF/CSV.  
* Generatore e lettore di QR code integrato nel backend.  
* Statistiche avanzate e premi speciali (voto outlier, votante estremo).  
* Duplicatore di eventi passati per usarli come template.  
* **Narratore Vocale Real-Time con AI Locale (Virtual Game-Show Host)**:  
  * *Concetto*: Un narratore vocale che commenta l'andamento del torneo direttamente dalle casse collegate al Mac mini (o riprodotto sul browser della TV via WebSocket audio), rendendo l'atmosfera simile a un quiz televisivo.  
  * *Sotto-Funzionalità*:  
    1. **Commento ai Voti (Divertente/Sardonico)**: L'AI analizza i dati dei voti appena sottomessi e genera battute personalizzate (es. *"Qualcuno ha appena dato 2 al Prodotto B per la consistenza... speriamo non fosse un dente rotto\!"*).  
    2. **Teasing sui Ritardatari**: Se un partecipante impiega troppo tempo per inviare la propria scheda, il narratore lo sollecita chiamandolo per nome (es. *"Tutti hanno votato tranne Lorenzo... starà ancora cercando di capire se la birra sa di luppolo o di cartone?"*).  
    3. **Presentazione Epica del Podio**: Durante la proclamazione finale, la voce introduce il terzo, secondo e primo classificato con pause drammatiche e sottofondo musicale generato in sincronia.  
  * *Implementazione Tecnica 100% Locale*:  
    * **LLM Locale (Generatore Testi)**: Integrazione nel backend Node.js di un'interfaccia verso **Ollama** (eseguito in locale sul Mac mini con un modello ultra-leggero e rapido come *Llama-3-8B-Instruct* o *Phi-3-mini*). L'applicazione invia un prompt strutturato contenente le statistiche del voto (es. chi ha votato, scostamenti insoliti di punteggio, chi è l'ultimo rimasto) per ricevere in ![][image10] una frase ironica e breve.  
    * **TTS Locale (Sintesi Vocale)**: Il testo generato viene convertito in file audio sul Mac mini tramite librerie TTS locali e performanti (come *Kokoro-TTS*, *Piper*, o usando direttamente il motore nativo di macOS tramite comando say con voci italiane ad alta definizione come "Alice" o "Luca").  
    * **Distribuzione Audio**: L'audio generato viene notificato via WebSocket al Reporter (TV) che lo riproduce istantaneamente tramite Web Audio API, garantendo sincronizzazione perfetta con le animazioni a schermo.