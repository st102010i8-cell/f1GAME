# GitHub 指南

這份指南說明怎麼在 GitHub 上管理 Grid 2026：把遊戲放上線、修改檔案、發布新版本。
全部都可以只用 GitHub 網頁完成；後半段另外附上用 git 指令的做法。

專案網址：<https://github.com/st102010i8-cell/f1GAME>

---

## 1. 把這次的拆分合併到 main

拆分後的檔案目前在分支 `claude/charming-gauss-gskqtt`，還沒進到 `main`。

1. 打開專案頁面，上方會出現黃色提示「… had recent pushes」，按 **Compare & pull request**。
   （沒看到提示的話：**Pull requests** → **New pull request** → compare 選 `claude/charming-gauss-gskqtt`。）
2. 按 **Create pull request**。
3. 按 **Merge pull request** → **Confirm merge**。

合併後 `main` 就是拆分好的版本。

## 2. 用 GitHub Pages 讓遊戲上線

1. 專案頁面 → **Settings** → 左側 **Pages**。
2. **Source** 選 **Deploy from a branch**。
3. **Branch** 選 `main`，資料夾選 `/ (root)`，按 **Save**。
4. 等 1–2 分鐘，重新整理頁面，上方會顯示網址：

   `https://st102010i8-cell.github.io/f1GAME/`

之後每次 `main` 有新的提交，網站會自動更新（通常 1 分鐘內）。
看不到更新時，在瀏覽器強制重新整理（Windows：Ctrl+F5；Mac：Cmd+Shift+R；手機：清除該網站的快取）。

> 免費帳號的 GitHub Pages 需要專案是 **Public**。
> 專案若是 Private，到 Settings → General 最下方 **Change visibility** 改成 Public。

## 3. 在網頁上直接改檔案

適合小修改（調數值、改文字）。

1. 點進要改的檔案，例如 `js/core.js`。
2. 按右上角的鉛筆圖示 **Edit this file**。
3. 改好後按 **Commit changes…**。
4. 訊息寫清楚改了什麼，例如 `修正：蒙札維修區出口太短`。
5. 選 **Commit directly to the main branch** → **Commit changes**。

想改哪裡、該開哪個檔案，對照下表：

| 想改的東西 | 檔案 |
| --- | --- |
| 車隊名稱、車手、性能、顏色 | `js/core.js`（`TEAMS`） |
| 賽道形狀與高低差 | `js/data/tracks.js` |
| 賽道場景（護欄、砂石區、看板、維修區） | `js/track-scene.js` |
| 操控手感、輪胎、電能 | `js/physics.js` |
| 電腦車難度與行為 | `js/ai.js` |
| 畫面上的儀表與計時 | `js/hud.js`、`index.html` |
| 選單、設定頁 | `js/screens.js`、`index.html` |
| 鍵盤與觸控 | `js/input.js` |
| 顏色、字體、版面 | `css/style.css` |
| 新手教學的步驟與文字 | `js/tutorial.js` |
| 版本號 | `js/core.js`（`VERSION`） |

## 4. 上傳新檔案或整批取代

1. 進到目標資料夾（例如 `js/`）。
2. **Add file** → **Upload files**。
3. 把檔案拖進去；同名檔案會被取代。
4. 填寫訊息後按 **Commit changes**。

新增的 JS 檔要記得在 `index.html` 最下方加一行 `<script src="js/檔名.js"></script>`，
位置要在 `js/main.js` 之前。

## 5. 發布新版本

每次改版做這三件事：

1. 改 `js/core.js` 裡的 `const VERSION='x.y.z';`
2. 在 `CHANGELOG.md` 最上方加一段新版本的說明。
3. （選用）建立 Release 留下版本紀錄：
   專案頁面右側 **Releases** → **Draft a new release** → **Choose a tag** 輸入 `v2.0.2` 這樣的版號
   → **Create new tag** → 填標題與說明 → **Publish release**。

版本規則：大改版 +1.0.0，加功能 +0.1.0，修問題 +0.0.1。

## 6. 改壞了怎麼救回來

- **看歷史**：檔案頁面右上角 **History**，可以看到每一次修改。
- **還原某次提交**：專案頁面 → **Commits** → 點進該次提交 → 右上 **…** → **Revert**
  （如果是透過 Pull request 合併的，在該 PR 頁面底部按 **Revert**）。
- **拿回舊版檔案**：History 裡點某次提交旁的 **<>**（Browse files），就能看到當時的完整專案並下載。

## 7. 用分支試新功能（建議的習慣）

大改動不要直接改 `main`，免得線上的遊戲壞掉。

1. 專案頁面左上的分支選單（顯示 `main`）→ 輸入新名稱，例如 `feature/rain` → **Create branch**。
2. 在這個分支上修改、提交。
3. 測試沒問題後，開 **Pull request** 合併回 `main`（步驟同第 1 節）。

## 8. 用電腦上的 git（進階）

第一次下載：

```bash
git clone https://github.com/st102010i8-cell/f1GAME.git
```

```bash
cd f1GAME
```

本機測試（開 `http://localhost:8000/`）：

```bash
python3 -m http.server 8000
```

改完後提交並上傳：

```bash
git add -A
```

```bash
git commit -m "修正：說明這次改了什麼"
```

```bash
git push
```

開始工作前先拿最新版本：

```bash
git pull
```

用分支開發：

```bash
git checkout -b feature/rain
```

```bash
git push -u origin feature/rain
```

## 9. 常見問題

**打開網址是 404**
Pages 還沒部署完（等 1–2 分鐘），或 Pages 的 Branch 沒選到 `main` / `(root)`，或專案是 Private。

**畫面一片空白**
按 F12 看 Console 的紅字。最常見是某個 JS 檔有語法錯誤，或 `index.html` 裡的 `<script>` 順序被改動、檔名打錯（GitHub Pages 的檔名**區分大小寫**）。

**改了但線上沒變**
到 **Actions** 分頁確認「pages build and deployment」有綠色勾勾，再強制重新整理瀏覽器。

**玩家的設定與成績會不會因為更新不見？**
不會。設定與排行榜存在玩家瀏覽器的 localStorage，只要網址不變就會保留。
