runOnStartup(async runtime => {

    window.c3_runtime = runtime;
    window.playerClicks = 0;
    window.gameStartTime = null;

    window.addEventListener("pointerdown", () => {
        window.playerClicks = (window.playerClicks || 0) + 1;
        if (!window.gameStartTime) window.gameStartTime = Date.now();
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            window.playerClicks = (window.playerClicks || 0) + 1;
            if (!window.gameStartTime) window.gameStartTime = Date.now();
        }
    });

    const crypto = document.createElement('script');
    crypto.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js";
    document.head.appendChild(crypto);


    const axiosScr = document.createElement('script');
    axiosScr.src = "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js";
    document.head.appendChild(axiosScr);

    if (window.onC3RuntimeReady) {
        try { window.onC3RuntimeReady(runtime); } catch (e) { console.error("Error in onC3RuntimeReady:", e); }
    }

});



const scriptsInEvents = {

	async Start_Event1_Act1(runtime, localVars)
	{
		
		const params 
		= new URL(window.location.href).searchParams;
		var val1 = params.get('id'); 
		
		
		runtime.globalVars.my_id_grep=val1;
		runtime.globalVars.Timestamp=Date.now();
		runtime.globalVars.Time1=new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", hour12: false });
		runtime.globalVars.Date=new Date().toISOString().slice(0, 10);
		
		
		//alert(val1);
		
		
	},

	async Global_Event66_Act1(runtime, localVars)
	{
		
		var today = new Date();
		
		var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
		var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
		runtime.globalVars.Date = date+' '+time;
		runtime.globalVars.Timestamp1 = Date.now();
		
		
	},

	async Global_Event66_Act2(runtime, localVars)
	{
var encryptionKey = runtime.globalVars.mosfet.toString();

const score = runtime.globalVars.SCORE || 0;

// Extra values
var second = runtime.globalVars.Seconds;
var clickcount = runtime.globalVars.clickCount;

async function encrypt(text, dateTime) {

    const KEY = encryptionKey + dateTime;

    // Ensure 32-byte key
    const fixedKey = KEY.padEnd(32, "0").slice(0, 32);

    const key = new TextEncoder().encode(fixedKey);

    const iv = crypto.getRandomValues(new Uint8Array(16));

    const algorithm = {
        name: "AES-CBC",
        iv: iv
    };

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        algorithm,
        false,
        ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
        algorithm,
        cryptoKey,
        new TextEncoder().encode(text.toString())
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);

    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
}

try {

    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const id = params.get("id");

    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const dateTime = `${year}${month}${day}${hours}${minutes}`;

    // Encrypt all values
    const encryptedScore = await encrypt(score.toString(), dateTime);
    const encryptedSecond = await encrypt(second.toString(), dateTime);
    const encryptedClickCount = await encrypt(clickcount.toString(), dateTime);

    const user = Date.now();

    // API list
    const apiList = [
        "https://html5.b2mwap.com/score_api/scores/4skfrq1y86mb.php",
        "https://html5.b2mwap.com/score_api/scores/a0dv8kiwn1w6.php",
        "https://html5.b2mwap.com/score_api/scores/qmz46659i40q.php",
        "https://html5.b2mwap.com/score_api/scores/x8e80t5lovzq.php"
    ];

    // Pick random API
    const randomApi = apiList[Math.floor(Math.random() * apiList.length)];

    // Final URL
    const url =
        `${randomApi}` +
        `?score=${encodeURIComponent(encryptedScore)}` +
        `&eyechecker=${encodeURIComponent(encryptedSecond)}` +
        `&pinCount=${encodeURIComponent(encryptedClickCount)}` +
        `&id=${encodeURIComponent(id)}` +
        `&token=${encodeURIComponent(token)}` +
        `&user=${user}` +
        `&dateTime=${dateTime}`;

    //console.log("Final URL:", url);

    fetch(url)
        .then((res) => {

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            return res.json();

        })
        .then((data) => {

            //console.log("API Used:", randomApi);
            //console.log(data);

        });

} catch (error) {

    //console.error("Error sending data:", error);

}

// Handle Game Over logging to note.txt and redirection to game-over/
try {
    const scoreVal = runtime.globalVars.SCORE || 0;
    
    // Accurate click count:
    let clicksVal = window.playerClicks || 0;
    if (clicksVal === 0) {
        clicksVal = (runtime.globalVars.clickCount >= 589677) ? (runtime.globalVars.clickCount - 589677) : (runtime.globalVars.clickCount || 0);
    }
    
    // Accurate time played:
    let totalSeconds = 0;
    if (window.gameStartTime) {
        totalSeconds = Math.max(1, Math.floor((Date.now() - window.gameStartTime) / 1000));
    } else if (runtime.globalVars.Seconds >= 589677) {
        totalSeconds = runtime.globalVars.Seconds - 589677;
    } else {
        totalSeconds = runtime.globalVars.Seconds || 0;
    }
    
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    const timeStr = `${m}m ${s}s`;
    const line = ` ${timeStr} - ${clicksVal} -  ${scoreVal}`;
    
    // Save to localStorage for game-over screen & maintain cumulative history
    try {
        localStorage.setItem("pacrush_last_run", JSON.stringify({
            time: timeStr,
            click: clicksVal,
            score: scoreVal
        }));

        let history = localStorage.getItem("pacrush_notes_history");
        if (!history || !history.includes("Time - Click - Score")) {
            history = "Time - Click - Score \n";
        }
        history = history.trimEnd() + "\n" + line;
        localStorage.setItem("pacrush_notes_history", history);
    } catch(e) {}
    
    // Direct Google Sheet webhook call
    try {
        const webhookUrl = localStorage.getItem("pacrush_sheet_webhook") || "https://script.google.com/macros/s/AKfycbx5f2y6W8RTQDw7jVKnnC0qIaewXRCnbgJ8mSAlOKTDym_Ga9vmhuCt_V3SbAY7Umaf/exec";
        fetch(webhookUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: payload
        }).catch(() => {});
    } catch(e) {}

    // Send to backend server to append to note.txt and redirect to game-over/
    const payload = JSON.stringify({ line: line, time: timeStr, click: clicksVal, score: scoreVal });
    const headers = { "Content-Type": "application/json" };
    
    Promise.allSettled([
        fetch("/api/log", { method: "POST", headers: headers, body: payload }),
        fetch("http://localhost:8080/api/log", { method: "POST", headers: headers, body: payload })
    ]).finally(() => {
        setTimeout(() => {
            window.location.href = `game-over/?time=${encodeURIComponent(timeStr)}&click=${clicksVal}&score=${scoreVal}`;
        }, 300);
    });
} catch(e) {
    window.location.href = "game-over/";
}
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
