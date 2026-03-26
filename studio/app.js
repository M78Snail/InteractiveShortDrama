// ==========================================
// 互动影视工作室 - Node Editor v2.0
// 简化为2种节点：剧情 + 选择
// ==========================================

// 状态管理
let state = {
    nodes: [],
    connections: [],
    selectedNode: null,
    startNodeId: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    projectName: '我的新项目',
    isDragging: false,
    isConnecting: false,
    connectingFrom: null,
    tempConnection: null,
    dragOffset: { x: 0, y: 0 },
    contextMenuPos: { x: 0, y: 0 },
    contextMenuConnectionId: null,
    uploadedFiles: {}  // 存储上传的文件: { nodeId: { data: Blob, name: string, type: 'image'|'video' } }
};

// 节点类型配置 - 简化为2种！
const nodeTypes = {
    scene: {
        name: '剧情节点',
        icon: '🎬',
        color: '#64c8ff',
        description: '播放视频/图片，播完自动进入下一节点',
        defaultData: {
            name: '剧情片段',
            mediaType: 'video',
            videoFile: null,
            imageFile: null,
            description: '',
            autoContinue: true
        }
    },
    choice: {
        name: '选择节点',
        icon: '🎮',
        color: '#ff64c8',
        description: '播放视频/图片，暂停等待观众选择',
        defaultData: {
            name: '选择时刻',
            mediaType: 'image',
            videoFile: null,
            imageFile: null,
            question: '请做出你的选择：',
            timeLimit: 0,
            choices: [
                { text: '选项 A', nextLabel: 'a' },
                { text: '选项 B', nextLabel: 'b' }
            ]
        }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    render();
    startAutoSave();
});

// ========== 事件监听器 ==========
function setupEventListeners() {
    const canvas = document.getElementById('canvas');
    const canvasContainer = document.querySelector('.canvas-container');

    document.querySelectorAll('.node-template').forEach(template => {
        template.addEventListener('dragstart', handleDragStart);
        template.addEventListener('dragend', handleDragEnd);
    });

    canvasContainer.addEventListener('dragover', handleDragOver);
    canvasContainer.addEventListener('drop', handleDrop);

    canvasContainer.addEventListener('click', (e) => {
        if (e.target === canvas || e.target.classList.contains('canvas-container')) {
            selectNode(null);
        }
    });

    canvasContainer.addEventListener('contextmenu', handleContextMenu);

    document.addEventListener('click', () => {
        document.getElementById('contextMenu').classList.remove('visible');
        document.getElementById('connectionContextMenu').classList.remove('visible');
    });

    let isPanning = false;
    let panStart = { x: 0, y: 0 };

    canvasContainer.addEventListener('mousedown', (e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanning = true;
            panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            state.pan.x = e.clientX - panStart.x;
            state.pan.y = e.clientY - panStart.y;
            updateCanvasTransform();
        }

        if (state.isConnecting && state.connectingFrom) {
            const rect = document.querySelector('.canvas-container').getBoundingClientRect();
            updateTempConnection(e.clientX - rect.left, e.clientY - rect.top);
        }
    });

    document.addEventListener('mouseup', () => {
        isPanning = false;
        if (state.isConnecting) {
            cancelConnection();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' && state.selectedNode) {
            deleteSelectedNode();
        }
        if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            saveProject();
        }
    });

    document.getElementById('projectName').addEventListener('input', (e) => {
        state.projectName = e.target.value;
    });
}

// ========== 拖拽处理 ==========
function handleDragStart(e) {
    e.dataTransfer.setData('nodeType', e.target.dataset.type);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (nodeType) {
        const rect = document.querySelector('.canvas-container').getBoundingClientRect();
        const x = e.clientX - rect.left - state.pan.x;
        const y = e.clientY - rect.top - state.pan.y;
        addNode(nodeType, x, y);
    }
}

// ========== 右键菜单 ==========
function handleContextMenu(e) {
    e.preventDefault();
    const rect = document.querySelector('.canvas-container').getBoundingClientRect();
    state.contextMenuPos = {
        x: e.clientX - rect.left - state.pan.x,
        y: e.clientY - rect.top - state.pan.y
    };

    const menu = document.getElementById('contextMenu');
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.classList.add('visible');
}

function addNodeAt(type) {
    addNode(type, state.contextMenuPos.x, state.contextMenuPos.y);
    document.getElementById('contextMenu').classList.remove('visible');
}

// ========== 节点管理 ==========
function addNode(type, x, y) {
    const config = nodeTypes[type];
    const node = {
        id: 'node_' + Date.now(),
        type: type,
        x: x,
        y: y,
        data: { ...config.defaultData }
    };
    state.nodes.push(node);

    if (state.nodes.length === 1) {
        state.startNodeId = node.id;
    }

    render();
    selectNode(node.id);
    showToast('已添加' + config.name, 'success');
}

function selectNode(nodeId) {
    state.selectedNode = nodeId;
    render();
    renderProperties();
}

function deleteSelectedNode() {
    if (!state.selectedNode) return;

    const nodeId = state.selectedNode;
    state.nodes = state.nodes.filter(n => n.id !== nodeId);
    state.connections = state.connections.filter(
        c => c.from !== nodeId && c.to !== nodeId
    );

    if (state.startNodeId === nodeId) {
        state.startNodeId = state.nodes.length > 0 ? state.nodes[0].id : null;
    }

    state.selectedNode = null;
    render();
    renderProperties();
    showToast('节点已删除', 'info');
}

function setStartNode(nodeId) {
    state.startNodeId = nodeId;
    render();
    renderProperties();
    showToast('已设置为起始节点', 'success');
}

// ========== 节点移动 ==========
function startDragNode(e, nodeId) {
    if (e.target.classList.contains('port') ||
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'INPUT') {
        return;
    }

    state.isDragging = true;
    state.selectedNode = nodeId;
    const node = state.nodes.find(n => n.id === nodeId);
    state.dragOffset = {
        x: e.clientX - node.x,
        y: e.clientY - node.y
    };

    document.addEventListener('mousemove', dragNode);
    document.addEventListener('mouseup', stopDragNode);
}

function dragNode(e) {
    if (!state.isDragging || !state.selectedNode) return;

    const node = state.nodes.find(n => n.id === state.selectedNode);
    if (node) {
        node.x = e.clientX - state.dragOffset.x;
        node.y = e.clientY - state.dragOffset.y;
        render();
    }
}

function stopDragNode() {
    state.isDragging = false;
    document.removeEventListener('mousemove', dragNode);
    document.removeEventListener('mouseup', stopDragNode);
}

// ========== 连接管理 ==========
function startConnection(e, nodeId, portType, choiceIndex = null) {
    e.stopPropagation();
    state.isConnecting = true;
    state.connectingFrom = { nodeId, portType, choiceIndex };
}

function endConnection(e, nodeId, portType) {
    e.stopPropagation();

    if (!state.isConnecting || !state.connectingFrom) return;

    const from = state.connectingFrom;

    // 确保：必须从输出点连接到输入点，且不是同一个节点
    if (from.nodeId !== nodeId && from.portType === 'output' && portType === 'input') {
        const exists = state.connections.some(
            c => c.from === from.nodeId && c.to === nodeId && c.choiceIndex === from.choiceIndex
        );

        if (!exists) {
            state.connections.push({
                id: 'conn_' + Date.now(),
                from: from.nodeId,
                to: nodeId,
                choiceIndex: from.choiceIndex
            });
            render();
        }
    }

    cancelConnection();
}

function cancelConnection() {
    state.isConnecting = false;
    state.connectingFrom = null;
    state.tempConnection = null;
    renderConnections();
}

function updateTempConnection(x, y) {
    state.tempConnection = { x, y };
    renderConnections();
}

function showConnectionContextMenu(e, connId) {
    e.preventDefault();
    e.stopPropagation();

    state.contextMenuConnectionId = connId;

    const menu = document.getElementById('connectionContextMenu');
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.classList.add('visible');
}

function deleteContextMenuConnection() {
    if (state.contextMenuConnectionId) {
        state.connections = state.connections.filter(c => c.id !== state.contextMenuConnectionId);
        state.contextMenuConnectionId = null;
        document.getElementById('connectionContextMenu').classList.remove('visible');
        render();
    }
}

function deleteConnection(connId) {
    // 不再直接点击删除
}

// ========== 渲染 ==========
function render() {
    renderNodes();
    // 先渲染节点，等下一帧再渲染连线（确保能获取到 DOM 位置）
    requestAnimationFrame(() => {
        renderConnections();
    });
    updateInfo();
}

function renderNodes() {
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = '';

    state.nodes.forEach(node => {
        const config = nodeTypes[node.type];
        const isSelected = state.selectedNode === node.id;
        const isStart = state.startNodeId === node.id;

        const el = document.createElement('div');
        el.className = `graph-node ${node.type} ${isSelected ? 'selected' : ''}`;
        el.style.left = (node.x + state.pan.x) + 'px';
        el.style.top = (node.y + state.pan.y) + 'px';
        el.dataset.nodeId = node.id;

        el.innerHTML = `
            <div class="node-header" onmousedown="startDragNode(event, '${node.id}')">
                <span class="node-type-icon">${config.icon}</span>
                <span class="node-name">${node.data.name || config.name}</span>
                ${isStart ? '<span class="start-badge">起点</span>' :
                  `<button class="set-start-btn" onclick="setStartNode('${node.id}')">设为起点</button>`}
            </div>
            <div class="node-body">
                <div class="node-summary">${getNodeSummary(node)}</div>
            </div>
            <div class="node-ports">
                <div class="port input" onmouseup="endConnection(event, '${node.id}', 'input')" title="输入"></div>
                ${renderOutputPorts(node)}
            </div>
        `;

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(node.id);
        });

        canvas.appendChild(el);
    });
}

function renderOutputPorts(node) {
    if (node.type === 'choice') {
        const choices = node.data.choices || [];
        return `<div class="branch-outputs">
            ${choices.map((c, i) =>
                `<div class="port branch-output"
                      onmousedown="startConnection(event, '${node.id}', 'output', ${i})"
                      title="${c.text}"></div>`
            ).join('')}
        </div>`;
    }
    return `<div class="port output" onmousedown="startConnection(event, '${node.id}', 'output')" title="输出"></div>`;
}

function getNodeSummary(node) {
    if (node.type === 'scene') {
        const type = node.data.mediaType === 'video' ? '🎥 视频' : '🖼️ 图片';
        const desc = node.data.description ? node.data.description.substring(0, 40) + '...' : '点击编辑';
        return `${type}\n${desc}`;
    }
    if (node.type === 'choice') {
        const question = node.data.question || '配置选择...';
        const choices = (node.data.choices || []).map(c => c.text).join(' | ');
        return `${question}\n${choices}`;
    }
    return '';
}

function renderConnections() {
    const svg = document.getElementById('connectionsLayer');
    const canvasRect = document.querySelector('.canvas-container').getBoundingClientRect();
    let html = '';

    state.connections.forEach(conn => {
        const fromEl = document.querySelector(`[data-node-id="${conn.from}"]`);
        const toEl = document.querySelector(`[data-node-id="${conn.to}"]`);

        if (fromEl && toEl) {
            const fromPos = getPortCenter(fromEl, 'output', conn.choiceIndex);
            const toPos = getPortCenter(toEl, 'input', null);

            if (fromPos && toPos) {
                const x1 = fromPos.x - canvasRect.left;
                const y1 = fromPos.y - canvasRect.top;
                const x2 = toPos.x - canvasRect.left;
                const y2 = toPos.y - canvasRect.top;

                const path = createBezierPath(x1, y1, x2, y2);

                html += `<path class="connection-path" d="${path}"
                              oncontextmenu="showConnectionContextMenu(event, '${conn.id}')"
                              title="右键删除连线"/>`;

                if (conn.choiceIndex !== null) {
                    const fromNode = state.nodes.find(n => n.id === conn.from);
                    if (fromNode && fromNode.data.choices && fromNode.data.choices[conn.choiceIndex]) {
                        const choice = fromNode.data.choices[conn.choiceIndex];
                        const midX = (x1 + x2) / 2;
                        const midY = (y1 + y2) / 2 - 10;
                        html += `<text x="${midX}" y="${midY}"
                                      fill="#ffd700" font-size="12" text-anchor="middle"
                                      style="pointer-events: none;">${choice.text.substring(0, 8)}...</text>`;
                    }
                }
            }
        }
    });

    if (state.isConnecting && state.connectingFrom && state.tempConnection) {
        const fromEl = document.querySelector(`[data-node-id="${state.connectingFrom.nodeId}"]`);
        if (fromEl) {
            const fromPos = getPortCenter(fromEl, 'output', state.connectingFrom.choiceIndex);
            if (fromPos) {
                const x1 = fromPos.x - canvasRect.left;
                const y1 = fromPos.y - canvasRect.top;

                const path = createBezierPath(x1, y1, state.tempConnection.x, state.tempConnection.y);
                html += `<path class="temp-connection" d="${path}"/>`;
            }
        }
    }

    svg.innerHTML = html;
}

// 通过 DOM 获取端口圆心的屏幕坐标
function getPortCenter(nodeEl, portType, choiceIndex = null) {
    let portEl;

    if (portType === 'input') {
        portEl = nodeEl.querySelector('.port.input');
    } else {
        if (choiceIndex !== null) {
            const outputs = nodeEl.querySelectorAll('.port.branch-output');
            portEl = outputs[choiceIndex];
        } else {
            portEl = nodeEl.querySelector('.port.output');
        }
    }

    if (!portEl) return null;

    const rect = portEl.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

function getPortPosition(node, portType, choiceIndex = null) {
    const nodeWidth = 220;
    const nodeHeight = 130;

    if (portType === 'input') {
        return { x: node.x, y: node.y + nodeHeight / 2 };
    } else {
        if (choiceIndex !== null) {
            const baseY = node.y + 60;
            const spacing = 32;
            return { x: node.x + nodeWidth, y: baseY + choiceIndex * spacing };
        }
        return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
    }
}

function createBezierPath(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// ========== 属性面板 ==========
function renderProperties() {
    const panel = document.getElementById('propertiesContent');
    const empty = document.getElementById('emptyState');

    if (!state.selectedNode) {
        panel.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    panel.style.display = 'block';
    empty.style.display = 'none';

    const node = state.nodes.find(n => n.id === state.selectedNode);
    const config = nodeTypes[node.type];

    let html = `
        <div class="prop-section">
            <div class="prop-section-title">基本信息</div>
            <div class="prop-group">
                <label class="prop-label">节点名称</label>
                <input type="text" class="prop-input" value="${node.data.name || ''}"
                       onchange="updateNodeData('name', this.value)">
            </div>
        </div>
    `;

    // 两种节点都有媒体上传
    const uploadedFile = state.uploadedFiles[node.id];
    html += `
        <div class="prop-section">
            <div class="prop-section-title">媒体设置</div>
            <div class="prop-group">
                <label class="prop-label">媒体类型</label>
                <select class="prop-select" onchange="updateNodeData('mediaType', this.value)">
                    <option value="video" ${node.data.mediaType === 'video' ? 'selected' : ''}>🎥 视频</option>
                    <option value="image" ${node.data.mediaType === 'image' ? 'selected' : ''}>🖼️ 图片</option>
                </select>
            </div>
            <div class="prop-group">
                <label class="prop-label">上传文件</label>
                <div class="file-upload" onclick="document.getElementById('mediaFile').click()">
                    <input type="file" id="mediaFile" accept="${node.data.mediaType === 'video' ? 'video/*' : 'image/*'}"
                           onchange="handleMediaUpload(this)">
                    <div>📤 点击上传${node.data.mediaType === 'video' ? '视频' : '图片'}</div>
                    ${uploadedFile ?
                        `<div style="font-size: 12px; color: #64ff8c; margin-top: 8px;">✓ ${uploadedFile.name}</div>` : ''}
                </div>
                ${uploadedFile ? renderFilePreview(node.id, uploadedFile) : ''}
            </div>
        </div>
    `;

    if (node.type === 'scene') {
        html += `
            <div class="prop-section">
                <div class="prop-section-title">剧情描述</div>
                <div class="prop-group">
                    <textarea class="prop-textarea" placeholder="输入这段剧情的描述..."
                              onchange="updateNodeData('description', this.value)">${node.data.description || ''}</textarea>
                </div>
                <div class="prop-group">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" ${node.data.autoContinue ? 'checked' : ''}
                               onchange="updateNodeData('autoContinue', this.checked)">
                        <span class="prop-label" style="margin: 0;">播完自动继续</span>
                    </label>
                </div>
            </div>
        `;
    }

    if (node.type === 'choice') {
        html += `
            <div class="prop-section">
                <div class="prop-section-title">互动设置</div>
                <div class="prop-group">
                    <label class="prop-label">问题/提示</label>
                    <textarea class="prop-textarea" placeholder="输入要问观众的问题..."
                              onchange="updateNodeData('question', this.value)">${node.data.question || ''}</textarea>
                </div>
                <div class="prop-group">
                    <label class="prop-label">时间限制（秒，0=不限制）</label>
                    <input type="number" class="prop-input" value="${node.data.timeLimit || 0}"
                           onchange="updateNodeData('timeLimit', parseInt(this.value))">
                </div>
            </div>
            <div class="prop-section">
                <div class="prop-section-title">选项（每个选项拖出一条线）</div>
                <div class="choice-list" id="choiceList">
                    ${(node.data.choices || []).map((choice, i) => `
                        <div class="choice-item">
                            <input type="text" class="prop-input" value="${choice.text}"
                                   placeholder="选项文本"
                                   onchange="updateChoice(${i}, 'text', this.value)">
                            <button class="btn btn-danger btn-small" onclick="removeChoice(${i})">×</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary btn-full" style="margin-top: 12px;" onclick="addChoice()">+ 添加选项</button>
            </div>
        `;
    }

    html += `
        <div class="prop-section" style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <button class="btn btn-danger btn-full" onclick="deleteSelectedNode()">🗑️ 删除此节点</button>
        </div>
    `;

    panel.innerHTML = html;
}

function updateNodeData(key, value) {
    const node = state.nodes.find(n => n.id === state.selectedNode);
    if (node) {
        node.data[key] = value;
        render();
    }
}

function addChoice() {
    const node = state.nodes.find(n => n.id === state.selectedNode);
    if (node && node.type === 'choice') {
        node.data.choices = node.data.choices || [];
        node.data.choices.push({ text: '新选项', nextLabel: 'choice_' + Date.now() });
        renderProperties();
        render();
    }
}

function removeChoice(index) {
    const node = state.nodes.find(n => n.id === state.selectedNode);
    if (node && node.data.choices) {
        node.data.choices.splice(index, 1);
        state.connections = state.connections.filter(
            c => !(c.from === node.id && c.choiceIndex === index)
        );
        renderProperties();
        render();
    }
}

function updateChoice(index, key, value) {
    const node = state.nodes.find(n => n.id === state.selectedNode);
    if (node && node.data.choices && node.data.choices[index]) {
        node.data.choices[index][key] = value;
        render();
    }
}

function handleMediaUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const node = state.nodes.find(n => n.id === state.selectedNode);
    if (!node) return;

    // 存储文件
    state.uploadedFiles[node.id] = {
        data: file,
        name: file.name,
        type: node.data.mediaType
    };

    showToast('文件已上传', 'success');
    renderProperties();
}

function renderFilePreview(nodeId, fileInfo) {
    if (fileInfo.type === 'image') {
        const url = URL.createObjectURL(fileInfo.data);
        return `<div class="file-preview"><img src="${url}" alt="预览"></div>`;
    } else {
        const url = URL.createObjectURL(fileInfo.data);
        return `<div class="file-preview"><video src="${url}" controls style="max-width:100%; max-height:150px;"></video></div>`;
    }
}

// ========== 缩放 ==========
function zoomIn() {
    state.zoom = Math.min(state.zoom * 1.2, 2);
    updateCanvasTransform();
    document.getElementById('zoomLevel').textContent = Math.round(state.zoom * 100) + '%';
}

function zoomOut() {
    state.zoom = Math.max(state.zoom / 1.2, 0.3);
    updateCanvasTransform();
    document.getElementById('zoomLevel').textContent = Math.round(state.zoom * 100) + '%';
}

function updateCanvasTransform() {
    render();
}

// ========== 项目管理 ==========
function saveProject() {
    // 构建文件元数据（不保存实际文件内容，只保存引用信息）
    const fileMetadata = {};
    for (const nodeId of Object.keys(state.uploadedFiles)) {
        const f = state.uploadedFiles[nodeId];
        fileMetadata[nodeId] = {
            name: f.name,
            type: f.type
        };
    }

    const project = {
        name: state.projectName,
        nodes: state.nodes,
        connections: state.connections,
        startNodeId: state.startNodeId,
        fileMetadata: fileMetadata,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('interactive_studio_project', JSON.stringify(project));

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (state.projectName || 'project') + '.json';
    a.click();
    URL.revokeObjectURL(url);

    showToast('项目已保存（媒体文件需重新上传）', 'success');
}

function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const project = JSON.parse(e.target.result);
                    loadProjectData(project);
                    showToast('项目已加载', 'success');
                } catch (err) {
                    showToast('加载失败：无效的项目文件', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function loadProjectData(project) {
    state.projectName = project.name || '新项目';
    state.nodes = project.nodes || [];
    state.connections = project.connections || [];
    state.startNodeId = project.startNodeId;
    state.selectedNode = null;
    state.uploadedFiles = {};  // 重置上传文件

    // 如果有文件元数据，显示提示
    if (project.fileMetadata) {
        const count = Object.keys(project.fileMetadata).length;
        if (count > 0) {
            setTimeout(() => {
                showToast(`项目包含 ${count} 个媒体文件，请重新上传`, 'info');
            }, 500);
        }
    }

    document.getElementById('projectName').value = state.projectName;
    render();
    renderProperties();
}

function newProject() {
    if (state.nodes.length > 0 && !confirm('确定要新建项目吗？当前项目将丢失。')) {
        return;
    }

    state.nodes = [];
    state.connections = [];
    state.selectedNode = null;
    state.startNodeId = null;
    state.projectName = '我的新项目';

    document.getElementById('projectName').value = state.projectName;
    render();
    renderProperties();
    showToast('已创建新项目', 'success');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('interactive_studio_project');
    if (saved) {
        try {
            const project = JSON.parse(saved);
            loadProjectData(project);
        } catch (e) {
            console.log('无法加载本地存储的项目');
        }
    }
}

function startAutoSave() {
    setInterval(() => {
        const project = {
            name: state.projectName,
            nodes: state.nodes,
            connections: state.connections,
            startNodeId: state.startNodeId,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('interactive_studio_project', JSON.stringify(project));
        document.getElementById('autoSaveStatus').textContent = '✓ 已自动保存';
        setTimeout(() => {
            document.getElementById('autoSaveStatus').textContent = '';
        }, 2000);
    }, 30000);
}

// ========== 导出 Flutter ==========
async function exportToFlutter() {
    if (!state.startNodeId) {
        showToast('请先设置起始节点', 'error');
        return;
    }

    if (typeof JSZip === 'undefined') {
        showToast('JSZip 库加载失败，请刷新页面重试', 'error');
        return;
    }

    showToast('正在生成导出包...', 'info');

    try {
        const zip = new JSZip();
        const story = convertToFlutterStory();

        // 添加 story.json
        zip.file('story.json', JSON.stringify(story, null, 2));

        // 创建 images 和 videos 文件夹
        const imagesFolder = zip.folder('images');
        const videosFolder = zip.folder('videos');

        // 添加所有上传的文件
        let fileCount = 0;
        for (const nodeId of Object.keys(state.uploadedFiles)) {
            const fileInfo = state.uploadedFiles[nodeId];
            const node = state.nodes.find(n => n.id === nodeId);

            if (!node) continue;

            // 根据JSON中的命名规则确定文件名
            let targetFileName;
            let targetFolder;

            if (node.data.mediaType === 'image') {
                targetFileName = nodeId + '.jpg';
                targetFolder = imagesFolder;
            } else {
                targetFileName = nodeId + '.mp4';
                targetFolder = videosFolder;
            }

            // 添加文件到zip
            targetFolder.file(targetFileName, fileInfo.data);
            fileCount++;
        }

        // 生成zip并下载
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipContent);
        const a = document.createElement('a');
        a.href = url;
        a.download = (state.projectName || 'flutter_project') + '.zip';
        a.click();
        URL.revokeObjectURL(url);

        showToast(`导出成功！包含 ${fileCount} 个媒体文件`, 'success');
    } catch (error) {
        console.error('导出失败:', error);
        showToast('导出失败：' + error.message, 'error');
    }
}

function convertToFlutterStory() {
    const nodes = {};

    state.nodes.forEach(node => {
        const flutterNode = {
            type: node.type,
            mediaType: node.data.mediaType,
            dialogue: node.data.description || node.data.question || '',
            choices: []
        };

        if (node.data.mediaType === 'image') {
            flutterNode.background = 'assets/images/' + node.id + '.jpg';
        } else {
            flutterNode.video = 'assets/videos/' + node.id + '.mp4';
        }

        if (node.type === 'choice' && node.data.choices) {
            flutterNode.question = node.data.question;
            flutterNode.timeLimit = node.data.timeLimit || 0;
            flutterNode.choices = node.data.choices.map((choice, i) => {
                const conn = state.connections.find(
                    c => c.from === node.id && c.choiceIndex === i
                );
                return {
                    text: choice.text,
                    nextNode: conn ? conn.to : 'ending'
                };
            });
        } else {
            const conn = state.connections.find(
                c => c.from === node.id && c.choiceIndex == null
            );
            if (conn) {
                flutterNode.choices = [{
                    text: '继续',
                    nextNode: conn.to
                }];
            }
            flutterNode.autoContinue = node.data.autoContinue !== false;
        }

        nodes[node.id] = flutterNode;
    });

    return {
        title: state.projectName,
        startNode: state.startNodeId,
        nodes: nodes
    };
}

// ========== 工具 ==========
function clearCanvas() {
    if (state.nodes.length > 0 && !confirm('确定要清空画布吗？')) {
        return;
    }
    state.nodes = [];
    state.connections = [];
    state.selectedNode = null;
    state.startNodeId = null;
    render();
    renderProperties();
    showToast('画布已清空', 'info');
}

function autoLayout() {
    const levels = topologicalSort();
    const levelWidth = 300;
    const nodeHeight = 180;

    levels.forEach((level, levelIndex) => {
        const totalHeight = level.length * nodeHeight;
        const startY = -totalHeight / 2 + window.innerHeight / 2;

        level.forEach((nodeId, nodeIndex) => {
            const node = state.nodes.find(n => n.id === nodeId);
            if (node) {
                node.x = 80 + levelIndex * levelWidth;
                node.y = startY + nodeIndex * nodeHeight;
            }
        });
    });

    render();
    showToast('自动排版完成', 'success');
}

function topologicalSort() {
    const visited = new Set();
    const levels = [];
    const inDegree = {};

    state.nodes.forEach(n => inDegree[n.id] = 0);
    state.connections.forEach(c => inDegree[c.to]++);

    let currentLevel = state.nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);

    while (currentLevel.length > 0) {
        levels.push(currentLevel);
        const nextLevel = [];

        currentLevel.forEach(nodeId => {
            state.connections
                .filter(c => c.from === nodeId)
                .forEach(c => {
                    inDegree[c.to]--;
                    if (inDegree[c.to] === 0) {
                        nextLevel.push(c.to);
                    }
                });
        });

        currentLevel = nextLevel;
    }

    return levels;
}

function validateGraph() {
    const issues = [];

    if (!state.startNodeId) {
        issues.push('❌ 未设置起始节点');
    }

    const nodeIds = new Set(state.nodes.map(n => n.id));
    state.connections.forEach(c => {
        if (!nodeIds.has(c.to)) {
            issues.push(`❌ 连接指向不存在的节点: ${c.to}`);
        }
    });

    if (issues.length === 0) {
        showToast('✅ 项目验证通过！', 'success');
    } else {
        alert(issues.join('\n'));
    }
}

function updateInfo() {
    document.getElementById('nodeCount').textContent = state.nodes.length;
    document.getElementById('connectionCount').textContent = state.connections.length;
    document.getElementById('startNode').textContent =
        state.startNodeId ? state.startNodeId.substring(0, 10) + '...' : '未设置';
}

// ========== Toast ==========
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' visible';

    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}
