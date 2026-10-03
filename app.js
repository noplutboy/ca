// Код партнёра для API Chaturbate (регистрация не нужна, код уже вставлен).
const WM = "T2CSW";
const API = "https://chaturbate.com/api/public/affiliates/onlinerooms/";
const $ = s => document.querySelector(s);
let offset = 0, current = null, req = 0, fallback = false;
const favs = new Set(JSON.parse(localStorage.favs || "[]"));

// Русские слова -> английские теги
const RU = {
  "блондинка":"blonde","блонд":"blonde","брюнетка":"brunette","рыжая":"redhead","азиатка":"asian",
  "азиатки":"asian","латинка":"latina","латина":"latina","грудь":"bigboobs","большая грудь":"bigboobs",
  "сиськи":"bigtits","попа":"bigass","жопа":"bigass","худая":"skinny","милая":"cute","новенькая":"new",
  "молодая":"18","зрелая":"mature","милф":"milf","пухлая":"curvy","тату":"tattoo","ноги":"feet",
  "чулки":"stockings","пара":"couple","русская":"russian","лесби":"lesbian","волосатая":"hairy",
  "очки":"glasses","анал":"anal","сквирт":"squirt","натуральная":"natural","эбони":"ebony"
};
const norm = t => { t = t.trim().toLowerCase().replace(/^#/, ""); return RU[t] || t.replace(/\s+/g, ""); };

async function api(params) {
  const q = new URLSearchParams({ wm: WM, client_ip: "request_ip", format: "json", ...params });
  if ($("#gender").value) q.set("gender", $("#gender").value);
  const r = await fetch(API + "?" + q);
  return (await r.json()).results || [];
}

function msg(t) { $("#grid").insertAdjacentHTML("beforeend", `<p class="msg">${t}</p>`); }

async function load(reset) {
  const my = ++req;
  if (reset) { offset = 0; fallback = false; $("#grid").innerHTML = ""; }
  if (fallback) return;
  const q = norm($("#tag").value);
  let rooms;
  try {
    rooms = await api(q ? { tag: q, limit: 40, offset } : { limit: 40, offset });
    // Тег не нашёлся — ищем слово в нике, описании и тегах среди 500 популярных эфиров
    if (q && reset && !rooms.length) {
      fallback = true;
      const all = await api({ limit: 500 });
      rooms = all.filter(r => (r.username + " " + r.display_name + " " + r.room_subject + " " + r.tags.join(" "))
        .toLowerCase().includes(q));
    }
  } catch (e) {
    if (my === req) msg("Не удалось загрузить эфиры. Если Chaturbate у тебя не открывается без VPN — включи VPN и нажми ↻.");
    return;
  }
  if (my !== req) return; // пришёл ответ на старый запрос — игнорируем
  if (reset && !rooms.length) { msg(`По запросу «${$("#tag").value}» ничего нет. Попробуй другой тег на английском: asian, blonde, latina, milf…`); return; }
  rooms.sort((a, b) => favs.has(b.username) - favs.has(a.username));
  for (const room of rooms) {
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `<img loading="lazy" src="${room.image_url}"><div class="v">👁 ${room.num_users}${favs.has(room.username) ? " ★" : ""}</div>
      <div class="i">${room.username}${room.age ? ", " + room.age : ""}</div>`;
    c.onclick = () => open(room);
    $("#grid").append(c);
  }
  offset += rooms.length;
  $("#more").hidden = fallback;
}

function open(room) {
  current = room;
  const m = (room.iframe_embed || "").match(/src=['"]([^'"]+)/);
  if (!m) { location.href = room.chat_room_url; return; }
  $("#frame").src = m[1].replace(/&amp;/g, "&").replace("bgcolor=white", "bgcolor=black");
  $("#title").textContent = room.username;
  $("#fav").textContent = favs.has(room.username) ? "★" : "☆";
  $("#player").hidden = false;
}
$("#close").onclick = () => { $("#player").hidden = true; $("#frame").src = "about:blank"; };
$("#fav").onclick = () => {
  const u = current.username;
  favs.has(u) ? favs.delete(u) : favs.add(u);
  localStorage.favs = JSON.stringify([...favs]);
  $("#fav").textContent = favs.has(u) ? "★" : "☆";
};
let timer;
$("#tag").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => load(true), 700); });
$("#sf").onsubmit = e => { e.preventDefault(); clearTimeout(timer); $("#tag").blur(); load(true); };
$("#go").onclick = () => load(true);
$("#gender").onchange = () => load(true);
$("#more").onclick = () => load(false);
load(true);
