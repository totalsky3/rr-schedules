import React, { useMemo, useState } from "react";

// ラウンドロビン（総当たり）スケジュールを作る関数（サークル法）
function generateRoundRobin(teams, { doubleRound = false, shuffle = false } = {}) {
  let list = [...teams].map((t) => t.trim()).filter(Boolean);
  if (shuffle) list = shuffleArray(list);
  const odd = list.length % 2 === 1;
  if (odd) list.push("BYE");

  const n = list.length;
  if (n < 2) return [];

  const rounds = n - 1; // 各チームは1回ずつ休み or 対戦
  const half = n / 2;

  // 配列を固定側 + 回転側に分ける
  const fixed = list[0];
  let rot = list.slice(1); // 回転側

  const schedule = [];
  for (let r = 0; r < rounds; r++) {
    const pairings = [];

    const left = [fixed, ...rot.slice(0, half - 1)];
    const right = rot.slice(half - 1).reverse();

    for (let i = 0; i < half; i++) {
      const a = left[i];
      const b = right[i];
      if (a === "BYE" || b === "BYE") {
        const player = a === "BYE" ? b : a;
        if (player !== "BYE") pairings.push({ bye: player });
      } else {
        // 偶数ラウンドでホーム/アウェイを入れ替える
        if (r % 2 === 0) pairings.push({ home: a, away: b });
        else pairings.push({ home: b, away: a });
      }
    }

    schedule.push(pairings);

    // 回転（末尾を先頭へ）
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)];
  }

  if (doubleRound) {
    const secondLeg = schedule.map((round) =>
      round.map((m) => (m.bye ? m : { home: m.away, away: m.home }))
    );
    return [...schedule, ...secondLeg];
  }

  return schedule;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function download(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function asCSV(schedule) {
  const rows = [["Round", "Home", "Away", "Note"]];
  schedule.forEach((round, idx) => {
    round.forEach((m) => {
      if (m.bye) rows.push([`${idx + 1}`, m.bye, "", "BYE"]);
      else rows.push([`${idx + 1}`, m.home, m.away, ""]);
    });
  });
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

function csvEscape(s) {
  const t = String(s ?? "");
  if (t.includes("\n") || t.includes(",") || t.includes('"')) {
    return '"' + t.replaceAll('"', '""') + '"';
  }
  return t;
}

export default function RoundRobinTournamentMaker() {
  const [teamsText, setTeamsText] = useState("チームA\nチームB\nチームC\nチームD");
  const [doubleRound, setDoubleRound] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [title, setTitle] = useState("総当たりトーナメント");

  const teams = useMemo(
    () =>
      teamsText
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    [teamsText]
  );

  const schedule = useMemo(
    () => generateRoundRobin(teams, { doubleRound, shuffle }),
    [teams, doubleRound, shuffle]
  );

  const teamCount = teams.length;
  const hasOdd = teamCount % 2 === 1;

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-neutral-400 mt-1">
            テキストボックスにチーム名を1行ずつ入力 → オプション選択 → 下にスケジュールが自動生成されます。
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左：設定 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-neutral-900 rounded-2xl p-4 shadow">
              <label className="block text-sm font-semibold mb-2">大会タイトル</label>
              <input
                className="w-full rounded-xl bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="大会名を入力"
              />
            </div>

            <div className="bg-neutral-900 rounded-2xl p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">チーム一覧（1行1チーム）</label>
                <span className="text-xs text-neutral-400">現在 {teamCount} チーム</span>
              </div>
              <textarea
                className="w-full h-56 rounded-xl bg-neutral-800 px-3 py-2 leading-6 outline-none focus:ring-2 focus:ring-indigo-500"
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                placeholder={"例:\nチームA\nチームB\nチームC"}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-xl px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm"
                  onClick={() => setTeamsText((t) => (t ? t + "\n" : "") + `チーム${String.fromCharCode(65 + teams.length)}`)}
                >
                  + チームを1行追加
                </button>
                <button
                  className="rounded-xl px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm"
                  onClick={() => setTeamsText("チームA\nチームB\nチームC\nチームD")}
                >
                  例を入れる
                </button>
                <button
                  className="rounded-xl px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm"
                  onClick={() => setTeamsText(teams.join("\n"))}
                >
                  余白/重複の整理
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-2xl p-4 shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">ホーム＆アウェイ（2回戦総当たり）</span>
                <input
                  type="checkbox"
                  checked={doubleRound}
                  onChange={(e) => setDoubleRound(e.target.checked)}
                  className="h-5 w-5 accent-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">チーム順をシャッフル</span>
                <input
                  type="checkbox"
                  checked={shuffle}
                  onChange={(e) => setShuffle(e.target.checked)}
                  className="h-5 w-5 accent-indigo-500"
                />
              </div>
              {hasOdd && (
                <p className="text-xs text-amber-400">※ チーム数が奇数のため、各ラウンドにBYE（休み）が1つ入ります。</p>
              )}
            </div>

            <div className="bg-neutral-900 rounded-2xl p-4 shadow space-y-2">
              <button
                className="w-full rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold"
                onClick={() => download(JSON.stringify(schedule, null, 2), `${title || "tournament"}-schedule.json`, "application/json")}
                disabled={schedule.length === 0}
              >
                JSONとして保存
              </button>
              <button
                className="w-full rounded-xl px-4 py-2 bg-neutral-800 hover:bg-neutral-700"
                onClick={() => download(asCSV(schedule), `${title || "tournament"}-schedule.csv`, "text/csv")}
                disabled={schedule.length === 0}
              >
                CSVとして保存
              </button>
              <button
                className="w-full rounded-xl px-4 py-2 bg-neutral-800 hover:bg-neutral-700"
                onClick={() => window.print()}
                disabled={schedule.length === 0}
              >
                印刷（ブラウザ）
              </button>
            </div>
          </div>

          {/* 右：スケジュール */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 rounded-2xl p-4 shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-400">自動生成スケジュール</div>
                <div className="text-xl font-bold">{schedule.length} ラウンド</div>
              </div>
              <div className="text-sm text-neutral-400">チーム数：{teamCount}{hasOdd ? "（+BYE）" : ""}</div>
            </div>

            {schedule.length === 0 ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center text-neutral-400">
                チームを2つ以上入力するとスケジュールが表示されます。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                {schedule.map((round, rIdx) => (
                  <div key={rIdx} className="bg-neutral-900 rounded-2xl p-4 shadow break-inside-avoid">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold">Round {rIdx + 1}</h2>
                      <span className="text-xs text-neutral-400">{round.filter(m=>!m.bye).length} 試合{round.some(m=>m.bye)?" / BYEあり":""}</span>
                    </div>
                    <ul className="space-y-2">
                      {round.map((m, i) => (
                        <li key={i} className="rounded-xl bg-neutral-800 px-3 py-2">
                          {m.bye ? (
                            <div className="text-neutral-300"><span className="text-neutral-400">BYE：</span>{m.bye}</div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold truncate pr-2">{m.home}</span>
                              <span className="text-neutral-400 mx-2">vs</span>
                              <span className="font-semibold truncate pl-2">{m.away}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-neutral-500">
          <p>
            アルゴリズム：サークル法（奇数の場合はBYEを追加して調整）。ホーム/アウェイはラウンドごとに交互。
          </p>
        </footer>
      </div>
    </div>
  );
}
