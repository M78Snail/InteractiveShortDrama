// 剧本拆解工具 - 主逻辑

let currentStory = null;
let assets = [];

// 示例剧本
const exampleMarkdown = `# 标题：电梯偶遇

## 节点：node_1
- 类型：image
- 背景：assets/images/elevator.jpg
- 对话：周一的早晨，写字楼的电梯里挤满了人。你好不容易挤了进去，电梯门缓缓关上。
- 选择：
  - 整理一下领带 → node_2a
  - 低头看手机 → node_2b
  - 观察周围的人 → node_2c

## 节点：node_2a
- 类型：image
- 背景：assets/images/elevator.jpg
- 对话：你开始整理领带，却不小心碰到了旁边的人。「啊，抱歉！」你连忙道歉。
- 选择：
  - 抬头看向对方 → node_3a
  - 继续低头道歉 → node_3b

## 节点：node_2b
- 类型：image
- 背景：assets/images/elevator.jpg
- 对话：你掏出手机假装看消息，却发现根本没有信号。电梯里一片沉默，只有轻微的机械声。
- 选择：
  - 收起手机 → node_3c

## 节点：node_2c
- 类型：image
- 背景：assets/images/elevator.jpg
- 对话：你环顾四周，发现角落里站着一个熟悉的身影——是隔壁部门的林晓！她似乎也看到了你。
- 选择：
  - 主动打招呼 → node_3a
  - 假装没看见 → node_3d

## 节点：node_3a
- 类型：image
- 背景：assets/images/elevator.jpg
- 人物：assets/images/linxiao_smile.png
- 对话：林晓对你微微一笑：「这么巧？你也在这层上班？」她的笑容很温暖，让你有些紧张。
- 选择：
  - 是啊，好巧！ → node_4a
  - 嗯...我在隔壁部门 → node_4b

## 节点：node_3b
- 类型：image
- 背景：assets/images/elevator.jpg
- 对话：「没关系。」一个温柔的声音响起。你抬头一看，是隔壁部门的林晓！她正微笑着看着你。
- 选择：
  - 是你啊，抱歉抱歉 → node_4a

## 节点：node_3c
- 类型：image
- 背景：assets/images/elevator.jpg
- 对话：你收起手机，刚好对上一双眼睛。是林晓！她似乎在看你，见你看来，她微微一笑。
- 选择：
  - 你好啊 → node_4a

## 节点：node_3d
- 类型：image
- 背景：assets/images/elevator.jpg
- 对话：你移开视线，但感觉林晓一直在看你。电梯终于到了，你快步走了出去。
- 选择：
  - （继续走） → ending_normal

## 节点：node_4a
- 类型：image
- 背景：assets/images/elevator.jpg
- 人物：assets/images/linxiao_smile.png
- 对话：「我知道你，上次开会你做的报告很棒。」林晓的眼睛亮晶晶的，「对了，这周六有空吗？我想请教你一些问题。」
- 选择：
  - 没问题，周六见！ → ending_good
  - 周六可能有事... → node_5a

## 节点：node_4b
- 类型：image
- 背景：assets/images/elevator.jpg
- 人物：assets/images/linxiao_smile.png
- 对话：「这样啊，那以后可以多交流。」林晓依然微笑着，「我叫林晓，很高兴认识你。」电梯到了，她先走了出去。
- 选择：
  - （走出电梯） → ending_normal

## 节点：node_5a
- 类型：image
- 背景：assets/images/elevator.jpg
- 人物：assets/images/linxiao_smile.png
- 对话：「那周日呢？」林晓似乎有些期待，「或者你什么时候有空？」
- 选择：
  - 那周六还是可以的 → ending_good
  - 下次再说吧 → ending_normal

## 结局：ending_good
- 类型：ending
- 背景：assets/images/coffee_shop.jpg
- 结局标题：美好的开始
- 对话：周六的咖啡馆，阳光透过窗户洒在林晓的笑脸上。你们聊了很多，从工作到兴趣爱好。临走时，林晓说：「下周还能见面吗？」你知道，这只是一个美好的开始。
- 选择：
  - 重新开始 → node_1

## 结局：ending_normal
- 类型：ending
- 背景：assets/images/office.jpg
- 结局标题：普通的一天
- 对话：你回到工位，开始了一天的工作。刚才的电梯偶遇只是一个小插曲，生活还在继续。只是偶尔，你会想起林晓的微笑。也许，下次应该更勇敢一点？
- 选择：
  - 重新开始 → node_1
`;

function loadExample() {
    document.getElementById('markdownInput').value = exampleMarkdown;
}

function parseMarkdown() {
    const markdown = document.getElementById('markdownInput').value;
    if (!markdown.trim()) {
        alert('请先输入 Markdown 剧本！');
        return;
    }

    try {
        const story = parseMarkdownToStory(markdown);
        currentStory = story;

        // 生成 JSON
        const jsonOutput = JSON.stringify(story, null, 2);
        document.getElementById('jsonOutput').textContent = jsonOutput;

        // 提取素材
        extractAssets(story);

        // 生成预览
        generatePreview(story);

        alert('拆解成功！');
    } catch (e) {
        alert('解析失败：' + e.message);
        console.error(e);
    }
}

function parseMarkdownToStory(markdown) {
    const lines = markdown.split('\n');
    const story = {
        title: '互动游戏',
        startNode: null,
        nodes: {}
    };

    let currentNode = null;
    let inChoices = false;
    let currentChoices = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // 标题
        if (line.startsWith('# 标题：')) {
            story.title = line.replace('# 标题：', '').trim();
            continue;
        }

        // 节点开始
        if (line.startsWith('## 节点：') || line.startsWith('## 结局：')) {
            // 保存上一个节点
            if (currentNode) {
                currentNode.choices = currentChoices;
                story.nodes[currentNode.id] = currentNode;
            }

            const nodeId = line.replace('## 节点：', '').replace('## 结局：', '').trim();
            currentNode = {
                id: nodeId,
                type: 'image',
                dialogue: '',
                choices: []
            };
            currentChoices = [];
            inChoices = false;

            // 设置起始节点
            if (!story.startNode) {
                story.startNode = nodeId;
            }

            // 标记结局
            if (line.startsWith('## 结局：')) {
                currentNode.isEnding = true;
            }
            continue;
        }

        if (!currentNode) continue;

        // 属性
        if (line.startsWith('- 类型：')) {
            const type = line.replace('- 类型：', '').trim();
            currentNode.type = type;
        } else if (line.startsWith('- 背景：')) {
            currentNode.background = line.replace('- 背景：', '').trim();
        } else if (line.startsWith('- 人物：')) {
            currentNode.character = line.replace('- 人物：', '').trim();
        } else if (line.startsWith('- 视频：')) {
            currentNode.video = line.replace('- 视频：', '').trim();
            currentNode.type = 'video';
        } else if (line.startsWith('- 对话：')) {
            currentNode.dialogue = line.replace('- 对话：', '').trim();
        } else if (line.startsWith('- 结局标题：')) {
            currentNode.endingTitle = line.replace('- 结局标题：', '').trim();
        } else if (line.startsWith('- 选择：')) {
            inChoices = true;
        } else if (inChoices && line.startsWith('  - ')) {
            const choiceText = line.replace('  - ', '').trim();
            const parts = choiceText.split('→');
            if (parts.length === 2) {
                currentChoices.push({
                    text: parts[0].trim(),
                    nextNode: parts[1].trim()
                });
            }
        } else if (line && !line.startsWith('- ')) {
            // 多行对话
            if (currentNode.dialogue) {
                currentNode.dialogue += '\n' + line;
            }
        }
    }

    // 保存最后一个节点
    if (currentNode) {
        currentNode.choices = currentChoices;
        story.nodes[currentNode.id] = currentNode;
    }

    return story;
}

function extractAssets(story) {
    assets = [];
    const assetSet = new Set();

    for (const [nodeId, node] of Object.entries(story.nodes)) {
        // 背景图
        if (node.background && !assetSet.has(node.background)) {
            assetSet.add(node.background);
            assets.push({
                id: 'bg_' + nodeId,
                type: 'image',
                name: `背景 - ${nodeId}`,
                path: node.background,
                nodeId: nodeId,
                completed: false
            });
        }

        // 人物立绘
        if (node.character && !assetSet.has(node.character)) {
            assetSet.add(node.character);
            assets.push({
                id: 'char_' + nodeId,
                type: 'image',
                name: `人物 - ${nodeId}`,
                path: node.character,
                nodeId: nodeId,
                completed: false
            });
        }

        // 视频
        if (node.video && !assetSet.has(node.video)) {
            assetSet.add(node.video);
            assets.push({
                id: 'video_' + nodeId,
                type: 'video',
                name: `视频 - ${nodeId}`,
                path: node.video,
                nodeId: nodeId,
                completed: false
            });
        }
    }

    renderAssets();
}

function renderAssets() {
    const container = document.getElementById('assetsList');

    if (assets.length === 0) {
        container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5); text-align: center; padding: 40px;">拆解剧本后，这里会显示需要的素材清单</p>';
        return;
    }

    container.innerHTML = '<div class="assets-list">' + assets.map(asset => `
        <div class="asset-item ${asset.completed ? 'completed' : 'pending'}" id="asset_${asset.id}">
            <div class="asset-header">
                <span class="asset-type type-${asset.type}">${asset.type === 'image' ? '图片' : '视频'}</span>
                <span class="status-badge ${asset.completed ? 'status-completed' : 'status-pending'}">
                    ${asset.completed ? '已上传' : '待生成'}
                </span>
            </div>
            <div class="asset-name">${asset.name}</div>
            <div class="asset-path">${asset.path}</div>
            <div class="asset-upload">
                <label class="file-input-label">
                    上传文件
                    <input type="file" accept="${asset.type === 'image' ? 'image/*' : 'video/*'}" onchange="handleFileUpload(event, '${asset.id}')">
                </label>
                <button class="btn btn-secondary" onclick="markCompleted('${asset.id}')">标记完成</button>
            </div>
            ${asset.preview ? `<img src="${asset.preview}" class="preview-image">` : ''}
        </div>
    `).join('') + '</div>';
}

function handleFileUpload(event, assetId) {
    const file = event.target.files[0];
    if (!file) return;

    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    // 预览
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            asset.preview = e.target.result;
            asset.completed = true;
            renderAssets();
        };
        reader.readAsDataURL(file);
    } else {
        asset.completed = true;
        renderAssets();
    }

    alert('已上传：' + file.name);
}

function markCompleted(assetId) {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
        asset.completed = !asset.completed;
        renderAssets();
    }
}

function copyJson() {
    const jsonOutput = document.getElementById('jsonOutput').textContent;
    navigator.clipboard.writeText(jsonOutput).then(() => {
        alert('已复制到剪贴板！');
    });
}

function downloadJson() {
    const jsonOutput = document.getElementById('jsonOutput').textContent;
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story.json';
    a.click();
    URL.revokeObjectURL(url);
}

function exportAssetList() {
    if (assets.length === 0) {
        alert('请先拆解剧本！');
        return;
    }

    const list = assets.map(a => `[${a.completed ? '✓' : '✗'}] ${a.type === 'image' ? '图片' : '视频'}: ${a.name}\n    路径: ${a.path}`).join('\n\n');

    const blob = new Blob([`素材清单 - ${currentStory?.title || '互动游戏'}\n\n` + list], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assets_list.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function saveProject() {
    const project = {
        story: currentStory,
        assets: assets,
        markdown: document.getElementById('markdownInput').value,
        savedAt: new Date().toISOString()
    };

    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
    URL.revokeObjectURL(url);
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'json') {
        document.getElementById('jsonTab').style.display = 'block';
        document.getElementById('previewTab').style.display = 'none';
    } else {
        document.getElementById('jsonTab').style.display = 'none';
        document.getElementById('previewTab').style.display = 'block';
    }
}

function generatePreview(story) {
    const container = document.getElementById('previewContent');

    let html = `
        <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-bottom: 8px;">📖 ${story.title}</h3>
            <p style="color: rgba(255,255,255,0.6);">节点数量: ${Object.keys(story.nodes).length} | 起始节点: ${story.startNode}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
    `;

    for (const [nodeId, node] of Object.entries(story.nodes)) {
        const isStart = nodeId === story.startNode;
        const isEnding = node.isEnding;

        html += `
            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; border: 2px solid ${isStart ? '#ffd700' : isEnding ? '#00ff64' : 'rgba(255,255,255,0.1)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>${nodeId}</strong>
                    ${isStart ? '<span style="background: rgba(255,215,0,0.2); color: #ffd700; padding: 2px 8px; border-radius: 4px; font-size: 12px;">起点</span>' : ''}
                    ${isEnding ? '<span style="background: rgba(0,255,100,0.2); color: #00ff64; padding: 2px 8px; border-radius: 4px; font-size: 12px;">结局</span>' : ''}
                </div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">
                    类型: ${node.type}
                </div>
                <div style="font-size: 13px; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${node.dialogue}
                </div>
                ${node.choices.length > 0 ? `
                    <div style="font-size: 12px; color: rgba(255,255,255,0.5);">
                        分支: ${node.choices.map(c => c.nextNode).join(' → ')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 自动加载示例（可选）
    // loadExample();
});
