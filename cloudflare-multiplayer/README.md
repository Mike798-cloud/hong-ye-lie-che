# 《终夜列车》1～3人联机服务

这个目录只部署到 Cloudflare Workers；游戏 HTML/CSS/JS 仍部署在原 GitHub Pages。

## 部署

Windows 可直接运行 `部署Cloudflare联机服务.bat`，或手动执行：

```bash
npm install
npx wrangler login
npx wrangler deploy
```

部署完成后 Wrangler 会输出 `https://xxxx.workers.dev`。把这个地址填入游戏文件：

`assets/js/multiplayer-config.js`

也可以回到压缩包根目录运行 `设置联机服务器地址.bat` 自动写入。

然后正常把游戏修改文件提交到 GitHub。

## 联机规则

- 每个房间最多 3 名玩家。
- 房主创建房间时，可从当前单人案情继续；队友加入时不会把自己的单人进度混进房间。
- 共享：证物、推论、现场登记、质证、人物照片观察、时间谜题、照片谜题、密码箱、阶段、隐藏关系、共同结案状态。
- 不共享：当前页面、当前人物/地点、搜索分页、提示层级、音量、付款状态。
- 共享状态采用单调合并：证物/推论取并集，已完成谜题不会被另一名玩家的旧状态回退。
- 最终结案与材料去向只能由房主提交；其他玩家可以继续查看和协作。
- 刷新或断线后会自动重连并保留席位；主动“退出调查组”会释放席位并恢复进入联机前备份的单人存档。
- 房主主动退出时，房主权限自动移交给仍在房间中最早加入的成员。

## 本地测试

```bash
npm install
npx wrangler dev
```

本地 Worker 默认通常是 `http://127.0.0.1:8787`，可临时把 `multiplayer-config.js` 的 `serverUrl` 改为该地址。
Cloudflare 自动部署初始化成功。
