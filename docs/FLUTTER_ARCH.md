# Flutter 引擎架构设计 2.0

基于节点图的互动影视游戏引擎。

## 数据结构

### StoryNode 2.0

```dart
enum NodeType {
  scene,        // 片段剧情
  interaction,  // 观众互动
  branch,       // 分支判断
  generator,    // 生成模块
}

class StoryNode {
  final String id;
  final NodeType type;
  final String? videoPath;      // 视频路径
  final String? imagePath;      // 图片路径
  final String description;      // 描述/问题
  final int? timeLimit;          // 互动时限
  final List<Choice>? choices;   // 选项列表
  final List<Branch>? branches;  // 分支列表
}

class Choice {
  final String text;
  final String nextNodeId;
}

class Branch {
  final String label;
  final String name;
  final String nextNodeId;
}
```

## 游戏流程

```
1. 加载 story.json
   ↓
2. 找到起始节点
   ↓
3. 播放节点（视频/图片）
   ├─ 片段剧情 → 自动播放完进入下一节点
   ├─ 观众互动 → 暂停，显示选项，倒计时
   ├─ 分支判断 → 根据前序选择路由
   └─ 生成模块 → （预留）
   ↓
4. 保存进度到 shared_preferences
   ↓
5. 循环直到结局
```

## 核心功能

- ✅ 视频播放器（video_player + chewie）
- ✅ 图片查看器
- ✅ 分支选择系统
- ✅ 倒计时互动
- ✅ 自动存档/读档
- ✅ 节点回退（历史记录）
- ✅ 播放/暂停控制
