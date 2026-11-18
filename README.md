# Grid 2026 方程式賽車

瀏覽器裡的 3D 方程式賽車遊戲（Three.js r128），純前端、不需要建置工具。

- 12 條賽道、5 支原創車隊、正賽與計時賽
- 輪胎配方與磨耗、電能模式與 OT、維修區進站
- 鍵盤與觸控操作、新手教學、畫質分級

目前版本：**v2.1.0**（更新紀錄見 [CHANGELOG.md](CHANGELOG.md)）

## 怎麼玩

**線上**：開啟 GitHub Pages 後，網址是
`https://st102010i8-cell.github.io/f1GAME/`（設定方式見 [GitHub 指南](docs/GITHUB_GUIDE.md)）。

**本機**：下載專案後，直接用瀏覽器開 `index.html`，或在專案資料夾啟動一個靜態伺服器：

```bash
python3 -m http.server 8000
```

然後開 `http://localhost:8000/`。需要網路連線（Three.js 與字型從 CDN 載入）。

## 檔案結構

```
index.html            頁面結構（HUD、選單、設定面板）與載入順序
css/style.css         全部樣式
js/data/tracks.js     賽道座標與高低差資料（TRACK_PTS、TRACK_ELEV）
js/core.js            車隊資料、賽道運算、動力單元、版本號 VERSION
js/settings.js        設定的讀取與儲存
js/renderer.js        Three.js 渲染器、燈光
js/track-scene.js     賽道場景（路面、護欄、維修區、場景物件）
js/car-model.js       賽車模型
js/state.js           遊戲狀態、無線電／提示、計時
js/physics.js         玩家車輛物理（輪胎、電能、碰撞）
js/ai.js              電腦車
js/hud.js             HUD
js/audio.js           引擎聲與音效
js/camera.js          攝影機
js/screens.js         選單畫面：車隊、賽道、設定
js/input.js           鍵盤與觸控輸入
js/graphics.js        畫質分級、起跑 UI、賽車線
js/tutorial.js        新手教學
js/main.js            主迴圈與啟動
```

### 修改時要注意

- 這些 JS 是一般的 `<script>`（不是 ES module），共用同一個全域範圍，
  **載入順序就是 `index.html` 裡的順序**，不要隨意調換；`main.js` 必須在最後。
- 新增檔案時，記得在 `index.html` 加上對應的 `<script src="js/檔名.js"></script>`。
- 最上層不要宣告名為 `top`、`location`、`document`、`window` 的變數（會跟瀏覽器內建衝突）。
- 改版時同步更新 `js/core.js` 的 `VERSION` 與 `CHANGELOG.md`。

## 版本規則

主版.功能.修正 — 大改版 +1.0.0，加功能 +0.1.0，修問題 +0.0.1。
