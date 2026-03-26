# 🎬 互动影视游戏开发套件

基于AI驱动的互动影视游戏一站式解决方案。

## 📦 项目结构

```
PersonalAi/
├── studio/                   # 🆕 节点图编辑器（新！）
│   ├── index.html        # 主页面
│   ├── styles.css        # 样式
│   └── app.js           # 编辑器逻辑
│
├── interactive_game/      # Flutter 游戏项目
│   ├── lib/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── screens/
│   │   └── widgets/
│   └── assets/
│
├── docs/                   # 文档
│   └── FLUTTER_ARCH.md   # Flutter 架构设计
│
└── old_tool/              # 旧版工具（保留参考）
```

## ✨ 新功能：节点图编辑器


### 4 种节点类型

| 节点 | 图标 | 功能 |
|------|------|------|
| 片段剧情 | 🎬 | 播放视频/图片 |
| 观众互动 | 🎮 | 配置选项和时限 |
| 分支判断 | 🔀 | 路由到不同支线 |
| 生成模块 | 🤖 | AI 生成素材 |

### 使用方法

```bash
cd studio
open index.html
```

功能特性：
- 🎨 拖拽式节点图编辑
- 💾 本地自动保存
- 📱 一键导出 Flutter story.json
- 🔗 可视化连接
- ⌨️ 快捷键支持（Delete删除，Cmd+S保存）

## 🎯 工作流程

1. **用节点图设计剧情**
   ```
   [片段剧情] → [选择节点] → [支线A/支线B] → [片段剧情] 
   ```

2. **导出 story.json**
   点击「导出 Flutter」

3. **素材放入 Flutter 项目**
   ```
   assets/images/
   assets/videos/
   ```

4. **运行 Flutter**

## 🚀 快速开始

### 打开节点编辑器
```bash
cd /Users/duxiaoming/PersonalAi/studio
open index.html
```

### 运行 Flutter
```bash
cd /Users/duxiaoming/PersonalAi/interactive_game
flutter pub get
flutter run
```

