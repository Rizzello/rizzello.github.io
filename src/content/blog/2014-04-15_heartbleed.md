---
title: "Heartbleed: è arrivato il momento di cambiare le password dei vostri account"
heroImage: "/downloads/2014-04-15/heartbleed.webp"
pubDate: "2014-04-15"
description: "Heartbleed (CVE-2014-0160) è bug di sicurezza presente sulla libreria crittografica OpenSSL (dalla versione 1.0.1 alla 1.0.1f), nella procedura responsabile della feature Heartbeat."
badge: "ARCHIVE"
tags: ["cybersecurity", "heartbleed", "it"]
---

<!--googleoff: index-->
<div class="bg-gray-100 text-gray-800 p-3 text-sm">
    <strong>Archivio:</strong> Quello che stai leggendo è un vecchio articolo, scritto per un blog aziendale e poi andato perso. 
    Ho pensato che fosse una buona idea riesumarlo, tuttavia le informazioni in esso contenute potrebbero non essere ancora valide.
</div>
<!--googleon: index-->

Sembra di essere tornati negli anni '90 (celebri per il Ping of Death o per lo scandalo del Key Escrow) e invece è il 2014. Stavamo iniziando a sentirci al sicuro dietro le nostre connessioni cifrate eppure è successo: la sicurezza del 17% dei sistemi informatici di tutto il mondo ha tremato... ma andiamo per gradi. 

Il nome in codice è <a href="https://heartbleed.com/" target="_blank">Heartbleed</a> (<a href="https://nvd.nist.gov/vuln/detail/CVE-2014-0160" target="_blank">CVE-2014-0160</a>): un bug di sicurezza presente sulla libreria crittografica OpenSSL (dalla versione 1.0.1 alla 1.0.1f), nella procedura responsabile della feature Heartbeat. Questa particolare feature (introdotta nell'<a href="https://datatracker.ietf.org/doc/html/rfc6520" target="_blank">RFC 6520</a> di Febbraio 2012) consente, per i protocolli TLS e DTLS (Transport Layer Security per TCP ed UDP rispettivamente), di testare l'effettiva presenza dell'interlocutore. L'Heartbeat permette quindi di migliorare l'efficienza (informazioni di interesse per gli interlocutori/dati totali trasmessi) delle comunicazioni cifrate perché, nella maggior parte dei casi, permette di evitare la rinegoziazione della connessione. 

Tutto bello fin qui se non fosse che circa due anni fa (in particolare il 31 Dicembre 2011, con effettiva propagazione a Marzo 2012) Robin Seggelmann, impegnato nello sviluppo e nel "miglioramento" della nuova feature su OpenSSL, commette un errore di programmazione, una svista: dimentica di inserire un controllo sul valore di un parametro. Il risultato è l'Heartbleed bug: variando in modo arbitrario questo parametro è possibile ottenere informazioni private (come password, dati di sessione, chiavi private, etc) fino ad un massimo di 64KB a richiesta.

Da quel lontano Marzo 2012, fino a fine Marzo 2014, ovvero per ben due anni, l'Heartbleed bug non viene ufficialmente scoperto. A questo punto è però difficile stabilire se e quando, qualcuno ha scoperto/utilizzato il bug prima della sua correzione (anche perché non lascia tracce del suo utilizzo) e, se non si vuole credere alle teorie del complotto che vedono implicata l'NSA, resta comunque il dato di fatto che la vulnerabilità esisteva già prima della sua scoperta. 

### Codice del bug
Ma, nella pratica, cosa ha causato il bug?

```
#ifndef OPENSSL_NO_HEARTBEATS 
int dtls1_process_heartbeat(SSL *s) { 
    unsigned char *p = &s->s3->rrec.data[0], *pl; 
    unsigned short hbtype; 
    unsigned int payload; 
    unsigned int padding = 16; /* Use minimum padding */ 

    /* Read type and payload length first */ 
    hbtype = *p++; 
    n2s(p, payload); 
    pl = p; 

    if (s->msg_callback) 
        s->msg_callback(0, s->version, TLS1_RT_HEARTBEAT, &s->s3->rrec.data[0], s->s3->rrec.length,	s, s->msg_callback_arg); 

    if (hbtype == TLS1_HB_REQUEST) { 
        unsigned char *buffer, *bp; 
        int r; 

        /* Allocate memory for the response, size is 1 byte 
         * message type, plus 2 bytes payload length, plus 
         * payload, plus padding 
         */ 
        buffer = OPENSSL_malloc(1 + 2 + payload + padding); 
        bp = buffer; 

        /* Enter response type, length and copy payload */ 
        *bp++ = TLS1_HB_RESPONSE; 
        s2n(payload, bp); 
        memcpy(bp, pl, payload); 
```
È un frammento di codice C e, per chi mastica un po' di programmazione, individuare l'errore è un gioco da ragazzi: l'istruzione `n2s(p, payload)` si occupa di copiare il numero di byte (che compongono i dati della richiesta) nella variabile payload e, fino all'istruzione `memcpy(bp, pl, payload)` (che si occupa invece di copiare le informazioni), non esistono controlli sul valore di payload (pertanto ad una richiesta con payload=n verranno inviati n byte, indipendentemente dall'effettiva grandezza dei dati inviati nella richiesta stessa). L'unico limite è imposto dal tipo di variabile che, potendo immagazzinare numeri da 0 a 65535, permette di prelevare un massimo di 65535 byte (ovvero la bellezza di circa 64KB). 

A distanza di una settimana tutti i principali fornitori di servizi web hanno corretto il bug e rigenerato i loro certificati: è arrivato quindi il momento di cambiare le password. 