/**
 * 问介AIer后台管理系统 - 应用逻辑
 * 云开发环境ID: cloud1-d7g8ol36z34e7a782
 */

// ==================== 全局变量 ====================
let app = null;
let db = null;
let currentUser = null;
let uploadedFiles = {}; // 存储已上传的文件信息

// 默认管理员密码（生产环境应修改）
const ADMIN_PASSWORD = 'admin123';

// 图标映射
const ICON_MAP = {
    calendar: '📅',
    video: '🎬',
    music: '🎵',
    camera: '📷',
    clock: '⏰',
    gift: '🎁',
    heart: '❤️',
    ring: '💍',
    flower: '💐',
    balloon: '🎈',
    cake: '🎂',
    light: '💡',
    mic: '🎤',
    note: '📝',
    mail: '📧',
    phone: '📞',
    location: '📍',
    share: '🔗',
    setting: '⚙️',
    creative: '🎨',
    wedding: '💒',
    notice: '📢',
    stage: '🎭',
    document: '📄',
    home: '🏠',
    case: '📁',
    process: '⚙️',
    materials: '📚'
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    // 检查是否已登录
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showMainPage();
    } else {
        showLoginPage();
    }
    
    // 绑定登录表单
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // 绑定导航点击
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavClick);
    });
    
    // 初始化云开发
    await initCloud();
});

// ==================== 云开发初始化 ====================
async function initCloud() {
    try {
        // 使用微信云开发Web SDK初始化
        // 注意：需要在云开发控制台 → 设置 → 安全设置 中添加当前域名到Web SDK安全域名
        
        app = cloudbase.init({
            env: 'cloud1-d7g8ol36z34e7a782'
        });
        
        // 先检查是否已登录
        const loginState = await app.auth().getLoginState();
        
        if (!loginState) {
            // 未登录，尝试匿名登录
            try {
                await app.auth().anonymousAuthProvider().signIn();
                console.log('匿名登录成功');
            } catch (anonError) {
                console.error('匿名登录失败，尝试自定义登录:', anonError);
                // 如果匿名登录失败，可能需要自定义登录
                showToast('请先在云开发控制台添加安全域名: wjaier.github.io', 'error');
                return;
            }
        }
        
        // 获取数据库引用
        db = app.database();
        
        console.log('云开发初始化成功');
        showToast('云开发连接成功');
    } catch (error) {
        console.error('云开发初始化失败:', error);
        showToast('云开发连接失败，请先在控制台添加安全域名', 'error');
    }
}

// ==================== 登录/登出 ====================
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showMainPage();
        showToast('登录成功');
    } else {
        showToast('密码错误，请重试', 'error');
    }
}

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    showLoginPage();
    showToast('已退出登录');
}

function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('main-page').classList.add('hidden');
}

function showMainPage() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-page').classList.remove('hidden');
    loadDashboard();
}

// ==================== 导航控制 ====================
function handleNavClick(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    navigateTo(page);
}

function navigateTo(page) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // 显示对应页面
    document.querySelectorAll('.content-page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`page-${page}`).classList.add('active');
    
    // 加载页面数据
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'splash':
            loadSplashConfig();
            break;
        case 'home-config':
            loadHomeConfig();
            break;
        case 'tabbar':
            loadTabBarConfig();
            break;
        case 'global':
            loadGlobalConfig();
            break;
        case 'share':
            loadShareConfig();
            break;
        case 'cases':
            loadCases();
            break;
        case 'case-detail':
            loadCaseDetailSelector();
            break;
        case 'processes':
            loadProcesses();
            break;
        case 'process-detail':
            loadProcessDetailSelector();
            break;
        case 'materials':
            loadMaterials();
            break;
        case 'material-detail':
            loadMaterialDetailSelector();
            break;
    }
    
    // 移动端关闭侧边栏
    document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ==================== 仪表盘 ====================
async function loadDashboard() {
    try {
        // 获取案例数量
        const casesRes = await db.collection('cases').count();
        document.getElementById('case-count').textContent = casesRes.total;
        
        // 获取流程数量
        const processesRes = await db.collection('processes').count();
        document.getElementById('process-count').textContent = processesRes.total;
        
        // 获取资料数量
        const materialsRes = await db.collection('materials').count();
        document.getElementById('material-count').textContent = materialsRes.total;
    } catch (error) {
        console.error('加载仪表盘失败:', error);
    }
}

// ==================== 配置管理 ====================

// 启动页配置
async function loadSplashConfig() {
    try {
        const res = await db.collection('config').doc('global').get();
        const config = res.data[0] || {};
        const splash = config.splash || {};
        
        document.getElementById('splash-logo').value = splash.logo || '';
        document.getElementById('splash-subtitle').value = splash.subtitle || '';
        document.getElementById('splash-brand').value = splash.brandText || '';
        
        // 显示已有视频
        if (config.splashVideo) {
            showUploadPreview('splash-video-area', config.splashVideo, 'video');
        }
    } catch (error) {
        console.error('加载启动页配置失败:', error);
    }
}

async function saveSplashConfig() {
    try {
        showLoading(true);
        
        const data = {
            splash: {
                logo: document.getElementById('splash-logo').value,
                subtitle: document.getElementById('splash-subtitle').value,
                brandText: document.getElementById('splash-brand').value
            }
        };
        
        // 如果有新上传的视频
        if (uploadedFiles['splashVideo']) {
            data.splashVideo = uploadedFiles['splashVideo'];
        }
        
        await db.collection('config').doc('global').update(data);
        
        showToast('启动页配置已保存');
    } catch (error) {
        console.error('保存启动页配置失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 首页配置
async function loadHomeConfig() {
    try {
        const res = await db.collection('config').doc('global').get();
        const config = res.data[0] || {};
        const home = config.home || {};
        
        document.getElementById('home-brand-en').value = home.brandName || '';
        document.getElementById('home-brand-cn').value = home.brandNameCn || '';
        
        // 渲染服务项目列表
        renderServicesList(home.services || []);
    } catch (error) {
        console.error('加载首页配置失败:', error);
    }
}

function renderServicesList(services) {
    const container = document.getElementById('services-list');
    container.innerHTML = services.map((service, index) => `
        <div class="service-item" data-index="${index}">
            <span class="drag-handle">⋮⋮</span>
            <select class="service-icon" onchange="updateService(${index}, 'icon', this.value)">
                ${Object.entries(ICON_MAP).map(([key, icon]) => 
                    `<option value="${key}" ${service.icon === key ? 'selected' : ''}>${icon} ${key}</option>`
                ).join('')}
            </select>
            <input type="text" value="${service.name}" 
                   onchange="updateService(${index}, 'name', this.value)"
                   placeholder="服务名称，如：AI CREATIVE">
            <button class="btn-danger btn-small" onclick="removeService(${index})">删除</button>
        </div>
    `).join('');
    
    // 保存当前服务列表到全局
    window.currentServices = services;
}

function updateService(index, field, value) {
    if (window.currentServices) {
        window.currentServices[index][field] = value;
    }
}

function addService() {
    if (!window.currentServices) {
        window.currentServices = [];
    }
    window.currentServices.push({ name: '新服务', icon: 'video' });
    renderServicesList(window.currentServices);
}

function removeService(index) {
    if (window.currentServices) {
        window.currentServices.splice(index, 1);
        renderServicesList(window.currentServices);
    }
}

async function saveHomeConfig() {
    try {
        showLoading(true);
        
        const data = {
            home: {
                brandName: document.getElementById('home-brand-en').value,
                brandNameCn: document.getElementById('home-brand-cn').value,
                services: window.currentServices || []
            }
        };
        
        await db.collection('config').doc('global').update(data);
        
        showToast('首页配置已保存');
    } catch (error) {
        console.error('保存首页配置失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 底部导航栏配置
async function loadTabBarConfig() {
    try {
        const res = await db.collection('config').doc('global').get();
        const config = res.data[0] || {};
        const tabBar = config.tabBar || [];
        
        renderTabBarList(tabBar);
    } catch (error) {
        console.error('加载导航栏配置失败:', error);
    }
}

function renderTabBarList(tabBar) {
    const container = document.getElementById('tabbar-list');
    container.innerHTML = tabBar.map((item, index) => `
        <div class="tabbar-item">
            <label>导航项 ${index + 1}</label>
            <select onchange="updateTabBar(${index}, 'icon', this.value)">
                ${Object.entries(ICON_MAP).map(([key, icon]) => 
                    `<option value="${key}" ${item.icon === key ? 'selected' : ''}>${icon} ${key}</option>`
                ).join('')}
            </select>
            <input type="text" value="${item.text}" 
                   onchange="updateTabBar(${index}, 'text', this.value)"
                   placeholder="导航文字">
            <input type="text" value="${item.pagePath}" 
                   onchange="updateTabBar(${index}, 'pagePath', this.value)"
                   placeholder="页面路径">
        </div>
    `).join('');
    
    window.currentTabBar = tabBar;
}

function updateTabBar(index, field, value) {
    if (window.currentTabBar) {
        window.currentTabBar[index][field] = value;
    }
}

async function saveTabBarConfig() {
    try {
        showLoading(true);
        
        await db.collection('config').doc('global').update({
            tabBar: window.currentTabBar || []
        });
        
        showToast('导航栏配置已保存');
    } catch (error) {
        console.error('保存导航栏配置失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 全局背景配置
async function loadGlobalConfig() {
    try {
        const res = await db.collection('config').doc('global').get();
        const config = res.data[0] || {};
        
        // 设置背景类型
        const bgType = config.backgroundType || 'image';
        document.querySelector(`input[name="bgType"][value="${bgType}"]`).checked = true;
        toggleBgType(bgType);
        
        // 显示已有背景
        if (config.backgroundImage) {
            showUploadPreview('bg-image-area', config.backgroundImage, 'image');
        }
        if (config.backgroundVideo) {
            showUploadPreview('bg-video-area', config.backgroundVideo, 'video');
        }
    } catch (error) {
        console.error('加载全局背景配置失败:', error);
    }
}

function toggleBgType(type) {
    const imageSection = document.getElementById('bg-image-section');
    const videoSection = document.getElementById('bg-video-section');
    
    if (type === 'image') {
        imageSection.classList.remove('hidden');
        videoSection.classList.add('hidden');
    } else {
        imageSection.classList.add('hidden');
        videoSection.classList.remove('hidden');
    }
}

async function saveGlobalConfig() {
    try {
        showLoading(true);
        
        const bgType = document.querySelector('input[name="bgType"]:checked').value;
        
        const data = {
            backgroundType: bgType
        };
        
        // 如果有新上传的文件
        if (uploadedFiles['backgroundImage']) {
            data.backgroundImage = uploadedFiles['backgroundImage'];
        }
        if (uploadedFiles['backgroundVideo']) {
            data.backgroundVideo = uploadedFiles['backgroundVideo'];
        }
        
        await db.collection('config').doc('global').update(data);
        
        showToast('全局背景配置已保存');
    } catch (error) {
        console.error('保存全局背景配置失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 分享配置
async function loadShareConfig() {
    try {
        const res = await db.collection('config').doc('global').get();
        const config = res.data[0] || {};
        const shareConfig = config.shareConfig || {};
        
        document.getElementById('share-default-title').value = shareConfig.defaultTitle || '';
        
        if (shareConfig.defaultImage) {
            showUploadPreview('share-default-image-area', shareConfig.defaultImage, 'image');
        }
    } catch (error) {
        console.error('加载分享配置失败:', error);
    }
}

async function saveShareConfig() {
    try {
        showLoading(true);
        
        const data = {
            shareConfig: {
                defaultTitle: document.getElementById('share-default-title').value
            }
        };
        
        if (uploadedFiles['shareDefaultImage']) {
            data.shareConfig.defaultImage = uploadedFiles['shareDefaultImage'];
        }
        
        await db.collection('config').doc('global').update(data);
        
        showToast('分享配置已保存');
    } catch (error) {
        console.error('保存分享配置失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== 案例管理 ====================
async function loadCases() {
    try {
        const res = await db.collection('cases').orderBy('order', 'asc').get();
        const cases = res.data || [];
        
        renderCasesTable(cases);
    } catch (error) {
        console.error('加载案例列表失败:', error);
        showToast('加载数据失败', 'error');
    }
}

function renderCasesTable(cases) {
    const tbody = document.getElementById('cases-tbody');
    
    if (cases.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">📁</div>
                        <p>暂无案例，点击上方按钮添加</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = cases.map(item => `
        <tr>
            <td>${item.order || 1}</td>
            <td><img src="${item.coverImage || '/images/bg1.jpg'}" alt="封面" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2240%22><rect fill=%22%23ddd%22 width=%2260%22 height=%2240%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22>封面</text></svg>'"></td>
            <td>${item.title}</td>
            <td>
                <div class="tag-list">
                    ${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </td>
            <td>
                <div class="actions">
                    <button class="btn-primary btn-small" onclick="editCase('${item._id}')">编辑</button>
                    <button class="btn-danger" onclick="deleteCase('${item._id}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openCaseModal(id = null) {
    document.getElementById('case-edit-id').value = id || '';
    document.getElementById('case-modal-title').textContent = id ? '编辑案例' : '添加案例';
    
    if (id) {
        loadCaseForEdit(id);
    } else {
        document.getElementById('case-edit-title').value = '';
        document.getElementById('case-edit-desc').value = '';
        document.getElementById('case-edit-tags').value = '';
        document.getElementById('case-edit-order').value = '1';
        clearUploadPreview('case-edit-cover-area');
    }
    
    openModal('case-modal');
}

async function loadCaseForEdit(id) {
    try {
        const res = await db.collection('cases').doc(id).get();
        const item = res.data;
        
        document.getElementById('case-edit-title').value = item.title || '';
        document.getElementById('case-edit-desc').value = item.desc || '';
        document.getElementById('case-edit-tags').value = (item.tags || []).join(', ');
        document.getElementById('case-edit-order').value = item.order || 1;
        
        if (item.coverImage) {
            showUploadPreview('case-edit-cover-area', item.coverImage, 'image');
        }
    } catch (error) {
        console.error('加载案例失败:', error);
    }
}

async function editCase(id) {
    openCaseModal(id);
}

async function saveCase() {
    try {
        showLoading(true);
        
        const id = document.getElementById('case-edit-id').value;
        const title = document.getElementById('case-edit-title').value;
        const desc = document.getElementById('case-edit-desc').value;
        const tagsStr = document.getElementById('case-edit-tags').value;
        const order = parseInt(document.getElementById('case-edit-order').value) || 1;
        const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
        
        const data = {
            title,
            desc,
            tags,
            order,
            updateTime: Date.now()
        };
        
        // 如果有新上传的封面
        if (uploadedFiles['caseEditCover']) {
            data.coverImage = uploadedFiles['caseEditCover'];
        }
        
        if (id) {
            await db.collection('cases').doc(id).update(data);
        } else {
            // 新增案例
            const caseId = 'case_' + Date.now();
            data._id = caseId;
            data.detailId = 'case_detail_' + Date.now();
            data.createTime = Date.now();
            
            await db.collection('cases').add(data);
            
            // 同时创建空的详情
            await db.collection('case_detail').add({
                _id: data.detailId,
                caseId: caseId,
                title: title,
                contentBlocks: []
            });
        }
        
        closeModal('case-modal');
        loadCases();
        showToast('案例保存成功');
    } catch (error) {
        console.error('保存案例失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteCase(id) {
    if (!confirm('确定要删除这个案例吗？')) return;
    
    try {
        showLoading(true);
        
        // 获取案例信息
        const caseRes = await db.collection('cases').doc(id).get();
        const caseData = caseRes.data;
        
        // 删除案例
        await db.collection('cases').doc(id).remove();
        
        // 删除关联的详情
        if (caseData && caseData.detailId) {
            await db.collection('case_detail').doc(caseData.detailId).remove();
        }
        
        loadCases();
        showToast('案例已删除');
    } catch (error) {
        console.error('删除案例失败:', error);
        showToast('删除失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== 案例详情编辑 ====================
async function loadCaseDetailSelector() {
    try {
        const res = await db.collection('cases').orderBy('order', 'asc').get();
        const cases = res.data || [];
        
        const selector = document.getElementById('case-detail-selector');
        selector.innerHTML = '<option value="">-- 选择案例 --</option>' + 
            cases.map(item => `<option value="${item._id}">${item.title}</option>`).join('');
    } catch (error) {
        console.error('加载案例选择器失败:', error);
    }
}

async function loadCaseDetail() {
    const caseId = document.getElementById('case-detail-selector').value;
    if (!caseId) return;
    
    try {
        // 获取案例信息
        const caseRes = await db.collection('cases').doc(caseId).get();
        const caseData = caseRes.data;
        
        // 获取详情信息
        const detailRes = await db.collection('case_detail').doc(caseData.detailId).get();
        const detail = detailRes.data || {};
        
        // 填充基本信息
        document.getElementById('case-title').value = detail.title || '';
        document.getElementById('case-tags').value = (detail.tags || []).join(', ');
        document.getElementById('case-intro').value = detail.intro || '';
        document.getElementById('case-quote').value = detail.quote || '';
        document.getElementById('case-share-title').value = detail.shareTitle || '';
        
        // 显示图片
        if (detail.heroImage) {
            showUploadPreview('case-hero-area', detail.heroImage, 'image');
        }
        if (detail.shareImage) {
            showUploadPreview('case-share-image-area', detail.shareImage, 'image');
        }
        
        // 渲染内容块
        renderContentBlocks(detail.contentBlocks || []);
        
    } catch (error) {
        console.error('加载案例详情失败:', error);
    }
}

function renderContentBlocks(blocks) {
    const container = document.getElementById('content-blocks');
    
    if (blocks.length === 0) {
        container.innerHTML = '<p class="empty-state-text">暂无内容，点击下方按钮添加</p>';
        window.currentContentBlocks = [];
        return;
    }
    
    window.currentContentBlocks = blocks;
    
    container.innerHTML = blocks.map((block, index) => {
        const typeLabels = {
            text: '文本',
            h2: '二级标题',
            h3: '三级标题',
            image: '单图',
            images2: '双图',
            images3: '三图',
            quote: '引用',
            divider: '分隔线',
            spacer: '间距'
        };
        
        let inputHtml = '';
        
        switch (block.type) {
            case 'text':
            case 'quote':
                inputHtml = `<textarea rows="3" placeholder="输入内容..." onchange="updateBlock(${index}, 'value', this.value)">${block.value || ''}</textarea>`;
                break;
            case 'h2':
            case 'h3':
                inputHtml = `<input type="text" value="${block.value || ''}" placeholder="输入标题..." onchange="updateBlock(${index}, 'value', this.value)">`;
                break;
            case 'image':
                inputHtml = `
                    <div class="image-item">
                        <img src="${block.value || ''}" alt="图片" onerror="this.style.display='none'">
                        <button type="button" class="remove-img" onclick="clearBlockValue(${index})">×</button>
                        <input type="file" accept="image/*" onchange="uploadBlockImage(${index}, this)">
                    </div>
                `;
                break;
            case 'images2':
            case 'images3':
                const count = block.type === 'images2' ? 2 : 3;
                inputHtml = `<div class="images-grid">` +
                    Array(count).fill(0).map((_, i) => `
                        <div class="image-item">
                            <img src="${(block.value || [])[i] || ''}" alt="图片${i+1}" onerror="this.style.display='none'">
                            <button type="button" class="remove-img" onclick="clearMultiBlockValue(${index}, ${i})">×</button>
                            <input type="file" accept="image/*" onchange="uploadMultiBlockImage(${index}, ${i}, this)">
                        </div>
                    `).join('') +
                `</div>`;
                break;
            case 'divider':
                inputHtml = '<div style="text-align:center;color:var(--text-light);">--- 分隔线 ---</div>';
                break;
            case 'spacer':
                inputHtml = `
                    <input type="number" value="${block.value || 20}" min="0" max="100" 
                           onchange="updateBlock(${index}, 'value', parseInt(this.value))">
                `;
                break;
        }
        
        return `
            <div class="content-block" data-index="${index}">
                <div class="content-block-header">
                    <span class="content-block-type">${typeLabels[block.type] || block.type}</span>
                    <div class="content-block-actions">
                        <button class="btn-small" onclick="moveBlock(${index}, -1)">↑</button>
                        <button class="btn-small" onclick="moveBlock(${index}, 1)">↓</button>
                        <button class="btn-danger btn-small" onclick="deleteBlock(${index})">删除</button>
                    </div>
                </div>
                <div class="content-block-body">
                    ${inputHtml}
                </div>
            </div>
        `;
    }).join('');
}

function addContentBlock(type) {
    if (!window.currentContentBlocks) {
        window.currentContentBlocks = [];
    }
    
    const newBlock = { type };
    
    if (['text', 'h2', 'h3', 'quote', 'spacer'].includes(type)) {
        newBlock.value = type === 'spacer' ? 20 : '';
    } else if (['images2', 'images3'].includes(type)) {
        newBlock.value = [];
    }
    
    window.currentContentBlocks.push(newBlock);
    renderContentBlocks(window.currentContentBlocks);
}

function updateBlock(index, field, value) {
    if (window.currentContentBlocks && window.currentContentBlocks[index]) {
        window.currentContentBlocks[index][field] = value;
    }
}

function clearBlockValue(index) {
    if (window.currentContentBlocks && window.currentContentBlocks[index]) {
        window.currentContentBlocks[index].value = '';
        renderContentBlocks(window.currentContentBlocks);
    }
}

function clearMultiBlockValue(blockIndex, imgIndex) {
    if (window.currentContentBlocks && window.currentContentBlocks[blockIndex]) {
        if (!window.currentContentBlocks[blockIndex].value) {
            window.currentContentBlocks[blockIndex].value = [];
        }
        window.currentContentBlocks[blockIndex].value[imgIndex] = '';
        renderContentBlocks(window.currentContentBlocks);
    }
}

function moveBlock(index, direction) {
    if (!window.currentContentBlocks) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= window.currentContentBlocks.length) return;
    
    const temp = window.currentContentBlocks[index];
    window.currentContentBlocks[index] = window.currentContentBlocks[newIndex];
    window.currentContentBlocks[newIndex] = temp;
    
    renderContentBlocks(window.currentContentBlocks);
}

function deleteBlock(index) {
    if (!window.currentContentBlocks) return;
    
    window.currentContentBlocks.splice(index, 1);
    renderContentBlocks(window.currentContentBlocks);
}

async function uploadBlockImage(blockIndex, input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        showLoading(true);
        
        // 上传到云存储
        const path = `cases/images/${Date.now()}_${file.name}`;
        const uploadRes = await app.uploadFile({
            cloudPath: path,
            filePath: file
        });
        
        const fileUrl = uploadRes.fileID;
        
        // 更新内容块
        if (window.currentContentBlocks && window.currentContentBlocks[blockIndex]) {
            window.currentContentBlocks[blockIndex].value = fileUrl;
            renderContentBlocks(window.currentContentBlocks);
        }
        
        showToast('图片上传成功');
    } catch (error) {
        console.error('上传图片失败:', error);
        showToast('上传失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function uploadMultiBlockImage(blockIndex, imgIndex, input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        showLoading(true);
        
        // 上传到云存储
        const path = `cases/images/${Date.now()}_${file.name}`;
        const uploadRes = await app.uploadFile({
            cloudPath: path,
            filePath: file
        });
        
        const fileUrl = uploadRes.fileID;
        
        // 更新内容块
        if (window.currentContentBlocks && window.currentContentBlocks[blockIndex]) {
            if (!window.currentContentBlocks[blockIndex].value) {
                window.currentContentBlocks[blockIndex].value = [];
            }
            window.currentContentBlocks[blockIndex].value[imgIndex] = fileUrl;
            renderContentBlocks(window.currentContentBlocks);
        }
        
        showToast('图片上传成功');
    } catch (error) {
        console.error('上传图片失败:', error);
        showToast('上传失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function saveCaseDetail() {
    const caseId = document.getElementById('case-detail-selector').value;
    if (!caseId) {
        showToast('请先选择案例', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        // 获取案例信息
        const caseRes = await db.collection('cases').doc(caseId).get();
        const caseData = caseRes.data;
        
        const data = {
            title: document.getElementById('case-title').value,
            tags: document.getElementById('case-tags').value.split(',').map(t => t.trim()).filter(t => t),
            intro: document.getElementById('case-intro').value,
            quote: document.getElementById('case-quote').value,
            shareTitle: document.getElementById('case-share-title').value,
            contentBlocks: window.currentContentBlocks || [],
            updateTime: Date.now()
        };
        
        // 如果有新上传的图片
        if (uploadedFiles['caseHeroImage']) {
            data.heroImage = uploadedFiles['caseHeroImage'];
        }
        if (uploadedFiles['caseShareImage']) {
            data.shareImage = uploadedFiles['caseShareImage'];
        }
        
        // 更新详情
        await db.collection('case_detail').doc(caseData.detailId).update(data);
        
        showToast('案例详情已保存');
    } catch (error) {
        console.error('保存案例详情失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== 流程管理 ====================
async function loadProcesses() {
    try {
        const res = await db.collection('processes').orderBy('order', 'asc').get();
        const processes = res.data || [];
        
        renderProcessesTable(processes);
    } catch (error) {
        console.error('加载流程列表失败:', error);
    }
}

function renderProcessesTable(processes) {
    const tbody = document.getElementById('processes-tbody');
    
    if (processes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">⚙️</div>
                        <p>暂无流程，点击上方按钮添加</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = processes.map(item => `
        <tr>
            <td>${item.order || 1}</td>
            <td><span class="icon-preview">${ICON_MAP[item.icon] || '⚙️'}</span></td>
            <td>${item.title}</td>
            <td>${item.duration || '-'}</td>
            <td>
                <div class="actions">
                    <button class="btn-primary btn-small" onclick="editProcess('${item._id}')">编辑</button>
                    <button class="btn-danger" onclick="deleteProcess('${item._id}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openProcessModal(id = null) {
    document.getElementById('process-edit-id').value = id || '';
    document.getElementById('process-modal-title').textContent = id ? '编辑流程' : '添加流程';
    
    if (id) {
        loadProcessForEdit(id);
    } else {
        document.getElementById('process-edit-title').value = '';
        document.getElementById('process-edit-desc').value = '';
        document.getElementById('process-edit-icon').value = 'video';
        document.getElementById('process-edit-duration').value = '';
        document.getElementById('process-edit-delivery').value = '';
        document.getElementById('process-edit-slogan').value = '';
        document.getElementById('process-edit-order').value = '1';
    }
    
    openModal('process-modal');
}

async function loadProcessForEdit(id) {
    try {
        const res = await db.collection('processes').doc(id).get();
        const item = res.data;
        
        document.getElementById('process-edit-title').value = item.title || '';
        document.getElementById('process-edit-desc').value = item.desc || '';
        document.getElementById('process-edit-icon').value = item.icon || 'video';
        document.getElementById('process-edit-duration').value = item.duration || '';
        document.getElementById('process-edit-delivery').value = item.delivery || '';
        document.getElementById('process-edit-slogan').value = item.slogan || '';
        document.getElementById('process-edit-order').value = item.order || 1;
    } catch (error) {
        console.error('加载流程失败:', error);
    }
}

async function editProcess(id) {
    openProcessModal(id);
}

async function saveProcess() {
    try {
        showLoading(true);
        
        const id = document.getElementById('process-edit-id').value;
        const data = {
            title: document.getElementById('process-edit-title').value,
            desc: document.getElementById('process-edit-desc').value,
            icon: document.getElementById('process-edit-icon').value,
            duration: document.getElementById('process-edit-duration').value,
            delivery: document.getElementById('process-edit-delivery').value,
            slogan: document.getElementById('process-edit-slogan').value,
            order: parseInt(document.getElementById('process-edit-order').value) || 1,
            updateTime: Date.now()
        };
        
        if (id) {
            await db.collection('processes').doc(id).update(data);
        } else {
            const processId = 'process_' + Date.now();
            data._id = processId;
            data.detailId = 'process_detail_' + Date.now();
            data.createTime = Date.now();
            
            await db.collection('processes').add(data);
            
            // 同时创建空的详情
            await db.collection('process_detail').add({
                _id: data.detailId,
                processId: processId,
                title: data.title,
                steps: []
            });
        }
        
        closeModal('process-modal');
        loadProcesses();
        showToast('流程保存成功');
    } catch (error) {
        console.error('保存流程失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteProcess(id) {
    if (!confirm('确定要删除这个流程吗？')) return;
    
    try {
        showLoading(true);
        
        const processRes = await db.collection('processes').doc(id).get();
        const processData = processRes.data;
        
        await db.collection('processes').doc(id).remove();
        
        if (processData && processData.detailId) {
            await db.collection('process_detail').doc(processData.detailId).remove();
        }
        
        loadProcesses();
        showToast('流程已删除');
    } catch (error) {
        console.error('删除流程失败:', error);
        showToast('删除失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== 流程详情编辑 ====================
async function loadProcessDetailSelector() {
    try {
        const res = await db.collection('processes').orderBy('order', 'asc').get();
        const processes = res.data || [];
        
        const selector = document.getElementById('process-detail-selector');
        selector.innerHTML = '<option value="">-- 选择流程 --</option>' + 
            processes.map(item => `<option value="${item._id}">${item.title}</option>`).join('');
    } catch (error) {
        console.error('加载流程选择器失败:', error);
    }
}

async function loadProcessDetail() {
    const processId = document.getElementById('process-detail-selector').value;
    if (!processId) return;
    
    try {
        const processRes = await db.collection('processes').doc(processId).get();
        const processData = processRes.data;
        
        const detailRes = await db.collection('process_detail').doc(processData.detailId).get();
        const detail = detailRes.data || {};
        
        document.getElementById('process-title').value = detail.title || '';
        document.getElementById('process-subtitle').value = detail.subtitle || '';
        document.getElementById('process-tags').value = (detail.tags || []).join(', ');
        document.getElementById('process-content').value = detail.content || '';
        document.getElementById('process-share-title').value = detail.shareTitle || '';
        
        if (detail.heroImage) {
            showUploadPreview('process-hero-area', detail.heroImage, 'image');
        }
        
        renderSteps(detail.steps || []);
    } catch (error) {
        console.error('加载流程详情失败:', error);
    }
}

function renderSteps(steps) {
    const container = document.getElementById('steps-list');
    
    if (steps.length === 0) {
        container.innerHTML = '<p class="empty-state-text">暂无步骤，点击下方按钮添加</p>';
        window.currentSteps = [];
        return;
    }
    
    window.currentSteps = steps;
    
    container.innerHTML = steps.map((step, index) => `
        <div class="step-item">
            <div class="step-header">
                <span class="step-number">${index + 1}</span>
                <button class="btn-danger btn-small" onclick="deleteStep(${index})">删除</button>
            </div>
            <div class="form-group">
                <label>步骤标题</label>
                <input type="text" value="${step.title || ''}" 
                       onchange="updateStep(${index}, 'title', this.value)">
            </div>
            <div class="form-group">
                <label>步骤描述</label>
                <textarea rows="2" onchange="updateStep(${index}, 'desc', this.value)">${step.desc || ''}</textarea>
            </div>
            <label>子项目</label>
            <div class="step-items-list">
                ${(step.items || []).map((item, itemIndex) => `
                    <div class="step-item-input">
                        <input type="text" value="${item}" 
                               onchange="updateStepItem(${index}, ${itemIndex}, this.value)">
                        <button class="btn-small" onclick="removeStepItem(${index}, ${itemIndex})">×</button>
                    </div>
                `).join('')}
                <button class="add-step-item" onclick="addStepItem(${index})">+ 添加子项目</button>
            </div>
        </div>
    `).join('');
}

function updateStep(index, field, value) {
    if (window.currentSteps && window.currentSteps[index]) {
        window.currentSteps[index][field] = value;
    }
}

function updateStepItem(stepIndex, itemIndex, value) {
    if (window.currentSteps && window.currentSteps[stepIndex]) {
        if (!window.currentSteps[stepIndex].items) {
            window.currentSteps[stepIndex].items = [];
        }
        window.currentSteps[stepIndex].items[itemIndex] = value;
    }
}

function addStepItem(stepIndex) {
    if (window.currentSteps && window.currentSteps[stepIndex]) {
        if (!window.currentSteps[stepIndex].items) {
            window.currentSteps[stepIndex].items = [];
        }
        window.currentSteps[stepIndex].items.push('');
        renderSteps(window.currentSteps);
    }
}

function removeStepItem(stepIndex, itemIndex) {
    if (window.currentSteps && window.currentSteps[stepIndex]) {
        window.currentSteps[stepIndex].items.splice(itemIndex, 1);
        renderSteps(window.currentSteps);
    }
}

function addStep() {
    if (!window.currentSteps) {
        window.currentSteps = [];
    }
    window.currentSteps.push({
        title: '新步骤',
        desc: '',
        items: []
    });
    renderSteps(window.currentSteps);
}

function deleteStep(index) {
    if (!window.currentSteps) return;
    window.currentSteps.splice(index, 1);
    renderSteps(window.currentSteps);
}

async function saveProcessDetail() {
    const processId = document.getElementById('process-detail-selector').value;
    if (!processId) {
        showToast('请先选择流程', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const processRes = await db.collection('processes').doc(processId).get();
        const processData = processRes.data;
        
        const data = {
            title: document.getElementById('process-title').value,
            subtitle: document.getElementById('process-subtitle').value,
            tags: document.getElementById('process-tags').value.split(',').map(t => t.trim()).filter(t => t),
            content: document.getElementById('process-content').value,
            shareTitle: document.getElementById('process-share-title').value,
            steps: window.currentSteps || [],
            updateTime: Date.now()
        };
        
        if (uploadedFiles['processHeroImage']) {
            data.heroImage = uploadedFiles['processHeroImage'];
        }
        
        await db.collection('process_detail').doc(processData.detailId).update(data);
        
        showToast('流程详情已保存');
    } catch (error) {
        console.error('保存流程详情失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== 资料管理 ====================
async function loadMaterials() {
    try {
        const res = await db.collection('materials').orderBy('order', 'asc').get();
        const materials = res.data || [];
        
        renderMaterialsTable(materials);
    } catch (error) {
        console.error('加载资料列表失败:', error);
    }
}

function renderMaterialsTable(materials) {
    const tbody = document.getElementById('materials-tbody');
    
    if (materials.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">📚</div>
                        <p>暂无资料，点击上方按钮添加</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = materials.map(item => `
        <tr>
            <td>${item.order || 1}</td>
            <td><span class="icon-preview">${ICON_MAP[item.icon] || '📚'}</span></td>
            <td>${item.title}</td>
            <td>${item.desc || '-'}</td>
            <td>
                <div class="actions">
                    <button class="btn-primary btn-small" onclick="editMaterial('${item._id}')">编辑</button>
                    <button class="btn-danger" onclick="deleteMaterial('${item._id}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openMaterialModal(id = null) {
    document.getElementById('material-edit-id').value = id || '';
    document.getElementById('material-modal-title').textContent = id ? '编辑资料' : '添加资料';
    
    if (id) {
        loadMaterialForEdit(id);
    } else {
        document.getElementById('material-edit-title').value = '';
        document.getElementById('material-edit-desc').value = '';
        document.getElementById('material-edit-icon').value = 'document';
        document.getElementById('material-edit-order').value = '1';
    }
    
    openModal('material-modal');
}

async function loadMaterialForEdit(id) {
    try {
        const res = await db.collection('materials').doc(id).get();
        const item = res.data;
        
        document.getElementById('material-edit-title').value = item.title || '';
        document.getElementById('material-edit-desc').value = item.desc || '';
        document.getElementById('material-edit-icon').value = item.icon || 'document';
        document.getElementById('material-edit-order').value = item.order || 1;
    } catch (error) {
        console.error('加载资料失败:', error);
    }
}

async function editMaterial(id) {
    openMaterialModal(id);
}

async function saveMaterial() {
    try {
        showLoading(true);
        
        const id = document.getElementById('material-edit-id').value;
        const data = {
            title: document.getElementById('material-edit-title').value,
            desc: document.getElementById('material-edit-desc').value,
            icon: document.getElementById('material-edit-icon').value,
            order: parseInt(document.getElementById('material-edit-order').value) || 1,
            updateTime: Date.now()
        };
        
        if (id) {
            await db.collection('materials').doc(id).update(data);
        } else {
            const materialId = 'material_' + Date.now();
            data._id = materialId;
            data.detailId = 'material_detail_' + Date.now();
            data.createTime = Date.now();
            
            await db.collection('materials').add(data);
            
            await db.collection('material_detail').add({
                _id: data.detailId,
                materialId: materialId,
                title: data.title,
                contentBlocks: []
            });
        }
        
        closeModal('material-modal');
        loadMaterials();
        showToast('资料保存成功');
    } catch (error) {
        console.error('保存资料失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteMaterial(id) {
    if (!confirm('确定要删除这个资料吗？')) return;
    
    try {
        showLoading(true);
        
        const materialRes = await db.collection('materials').doc(id).get();
        const materialData = materialRes.data;
        
        await db.collection('materials').doc(id).remove();
        
        if (materialData && materialData.detailId) {
            await db.collection('material_detail').doc(materialData.detailId).remove();
        }
        
        loadMaterials();
        showToast('资料已删除');
    } catch (error) {
        console.error('删除资料失败:', error);
        showToast('删除失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== 资料详情编辑 ====================
async function loadMaterialDetailSelector() {
    try {
        const res = await db.collection('materials').orderBy('order', 'asc').get();
        const materials = res.data || [];
        
        const selector = document.getElementById('material-detail-selector');
        selector.innerHTML = '<option value="">-- 选择资料 --</option>' + 
            materials.map(item => `<option value="${item._id}">${item.title}</option>`).join('');
    } catch (error) {
        console.error('加载资料选择器失败:', error);
    }
}

async function loadMaterialDetail() {
    const materialId = document.getElementById('material-detail-selector').value;
    if (!materialId) return;
    
    try {
        const materialRes = await db.collection('materials').doc(materialId).get();
        const materialData = materialRes.data;
        
        const detailRes = await db.collection('material_detail').doc(materialData.detailId).get();
        const detail = detailRes.data || {};
        
        document.getElementById('material-share-title').value = detail.shareTitle || '';
        
        if (detail.heroImage) {
            showUploadPreview('material-hero-area', detail.heroImage, 'image');
        }
        
        renderMaterialContentBlocks(detail.contentBlocks || []);
    } catch (error) {
        console.error('加载资料详情失败:', error);
    }
}

function renderMaterialContentBlocks(blocks) {
    const container = document.getElementById('material-content-blocks');
    
    if (blocks.length === 0) {
        container.innerHTML = '<p class="empty-state-text">暂无内容，点击下方按钮添加</p>';
        window.currentMaterialContentBlocks = [];
        return;
    }
    
    window.currentMaterialContentBlocks = blocks;
    
    container.innerHTML = blocks.map((block, index) => {
        const typeLabels = {
            text: '文本',
            h2: '二级标题',
            h3: '三级标题',
            image: '单图',
            images2: '双图',
            images3: '三图',
            quote: '引用',
            divider: '分隔线',
            spacer: '间距'
        };
        
        let inputHtml = '';
        
        switch (block.type) {
            case 'text':
            case 'quote':
                inputHtml = `<textarea rows="3" placeholder="输入内容..." onchange="updateMaterialBlock(${index}, 'value', this.value)">${block.value || ''}</textarea>`;
                break;
            case 'h2':
            case 'h3':
                inputHtml = `<input type="text" value="${block.value || ''}" placeholder="输入标题..." onchange="updateMaterialBlock(${index}, 'value', this.value)">`;
                break;
            case 'image':
                inputHtml = `
                    <div class="image-item">
                        <img src="${block.value || ''}" alt="图片" onerror="this.style.display='none'">
                        <button type="button" class="remove-img" onclick="clearMaterialBlockValue(${index})">×</button>
                        <input type="file" accept="image/*" onchange="uploadMaterialBlockImage(${index}, this)">
                    </div>
                `;
                break;
            case 'images2':
            case 'images3':
                const count = block.type === 'images2' ? 2 : 3;
                inputHtml = `<div class="images-grid">` +
                    Array(count).fill(0).map((_, i) => `
                        <div class="image-item">
                            <img src="${(block.value || [])[i] || ''}" alt="图片${i+1}" onerror="this.style.display='none'">
                            <button type="button" class="remove-img" onclick="clearMaterialMultiBlockValue(${index}, ${i})">×</button>
                            <input type="file" accept="image/*" onchange="uploadMaterialMultiBlockImage(${index}, ${i}, this)">
                        </div>
                    `).join('') +
                `</div>`;
                break;
            case 'divider':
                inputHtml = '<div style="text-align:center;color:var(--text-light);">--- 分隔线 ---</div>';
                break;
            case 'spacer':
                inputHtml = `<input type="number" value="${block.value || 20}" min="0" max="100" onchange="updateMaterialBlock(${index}, 'value', parseInt(this.value))">`;
                break;
        }
        
        return `
            <div class="content-block" data-index="${index}">
                <div class="content-block-header">
                    <span class="content-block-type">${typeLabels[block.type] || block.type}</span>
                    <div class="content-block-actions">
                        <button class="btn-small" onclick="moveMaterialBlock(${index}, -1)">↑</button>
                        <button class="btn-small" onclick="moveMaterialBlock(${index}, 1)">↓</button>
                        <button class="btn-danger btn-small" onclick="deleteMaterialBlock(${index})">删除</button>
                    </div>
                </div>
                <div class="content-block-body">${inputHtml}</div>
            </div>
        `;
    }).join('');
}

function addMaterialContentBlock(type) {
    if (!window.currentMaterialContentBlocks) {
        window.currentMaterialContentBlocks = [];
    }
    
    const newBlock = { type };
    
    if (['text', 'h2', 'h3', 'quote', 'spacer'].includes(type)) {
        newBlock.value = type === 'spacer' ? 20 : '';
    } else if (['images2', 'images3'].includes(type)) {
        newBlock.value = [];
    }
    
    window.currentMaterialContentBlocks.push(newBlock);
    renderMaterialContentBlocks(window.currentMaterialContentBlocks);
}

function updateMaterialBlock(index, field, value) {
    if (window.currentMaterialContentBlocks && window.currentMaterialContentBlocks[index]) {
        window.currentMaterialContentBlocks[index][field] = value;
    }
}

function clearMaterialBlockValue(index) {
    if (window.currentMaterialContentBlocks && window.currentMaterialContentBlocks[index]) {
        window.currentMaterialContentBlocks[index].value = '';
        renderMaterialContentBlocks(window.currentMaterialContentBlocks);
    }
}

function clearMaterialMultiBlockValue(blockIndex, imgIndex) {
    if (window.currentMaterialContentBlocks && window.currentMaterialContentBlocks[blockIndex]) {
        if (!window.currentMaterialContentBlocks[blockIndex].value) {
            window.currentMaterialContentBlocks[blockIndex].value = [];
        }
        window.currentMaterialContentBlocks[blockIndex].value[imgIndex] = '';
        renderMaterialContentBlocks(window.currentMaterialContentBlocks);
    }
}

function moveMaterialBlock(index, direction) {
    if (!window.currentMaterialContentBlocks) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= window.currentMaterialContentBlocks.length) return;
    
    const temp = window.currentMaterialContentBlocks[index];
    window.currentMaterialContentBlocks[index] = window.currentMaterialContentBlocks[newIndex];
    window.currentMaterialContentBlocks[newIndex] = temp;
    
    renderMaterialContentBlocks(window.currentMaterialContentBlocks);
}

function deleteMaterialBlock(index) {
    if (!window.currentMaterialContentBlocks) return;
    window.currentMaterialContentBlocks.splice(index, 1);
    renderMaterialContentBlocks(window.currentMaterialContentBlocks);
}

async function uploadMaterialBlockImage(blockIndex, input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        showLoading(true);
        
        const path = `materials/images/${Date.now()}_${file.name}`;
        const uploadRes = await app.uploadFile({
            cloudPath: path,
            filePath: file
        });
        
        if (window.currentMaterialContentBlocks && window.currentMaterialContentBlocks[blockIndex]) {
            window.currentMaterialContentBlocks[blockIndex].value = uploadRes.fileID;
            renderMaterialContentBlocks(window.currentMaterialContentBlocks);
        }
        
        showToast('图片上传成功');
    } catch (error) {
        console.error('上传图片失败:', error);
        showToast('上传失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function uploadMaterialMultiBlockImage(blockIndex, imgIndex, input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        showLoading(true);
        
        const path = `materials/images/${Date.now()}_${file.name}`;
        const uploadRes = await app.uploadFile({
            cloudPath: path,
            filePath: file
        });
        
        if (window.currentMaterialContentBlocks && window.currentMaterialContentBlocks[blockIndex]) {
            if (!window.currentMaterialContentBlocks[blockIndex].value) {
                window.currentMaterialContentBlocks[blockIndex].value = [];
            }
            window.currentMaterialContentBlocks[blockIndex].value[imgIndex] = uploadRes.fileID;
            renderMaterialContentBlocks(window.currentMaterialContentBlocks);
        }
        
        showToast('图片上传成功');
    } catch (error) {
        console.error('上传图片失败:', error);
        showToast('上传失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function saveMaterialDetail() {
    const materialId = document.getElementById('material-detail-selector').value;
    if (!materialId) {
        showToast('请先选择资料', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const materialRes = await db.collection('materials').doc(materialId).get();
        const materialData = materialRes.data;
        
        const data = {
            shareTitle: document.getElementById('material-share-title').value,
            contentBlocks: window.currentMaterialContentBlocks || [],
            updateTime: Date.now()
        };
        
        if (uploadedFiles['materialHeroImage']) {
            data.heroImage = uploadedFiles['materialHeroImage'];
        }
        
        await db.collection('material_detail').doc(materialData.detailId).update(data);
        
        showToast('资料详情已保存');
    } catch (error) {
        console.error('保存资料详情失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== 文件上传处理 ====================
async function handleImageUpload(input, key) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        showLoading(true);
        
        // 转换为blob
        const blob = await fetch(URL.createObjectURL(file)).then(r => r.blob());
        
        // 上传到云存储
        const path = `uploads/${Date.now()}_${file.name}`;
        const uploadRes = await app.uploadFile({
            cloudPath: path,
            filePath: blob
        });
        
        const fileUrl = uploadRes.fileID;
        
        // 保存到上传记录
        uploadedFiles[key] = fileUrl;
        
        // 显示预览
        const areaId = getAreaIdByKey(key);
        showUploadPreview(areaId, fileUrl, 'image');
        
        showToast('图片上传成功');
    } catch (error) {
        console.error('上传图片失败:', error);
        showToast('上传失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleVideoUpload(input, key) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        showLoading(true);
        
        // 转换为blob
        const blob = await fetch(URL.createObjectURL(file)).then(r => r.blob());
        
        // 上传到云存储
        const path = `videos/${Date.now()}_${file.name}`;
        const uploadRes = await app.uploadFile({
            cloudPath: path,
            filePath: blob
        });
        
        const fileUrl = uploadRes.fileID;
        
        uploadedFiles[key] = fileUrl;
        
        const areaId = getAreaIdByKey(key);
        showUploadPreview(areaId, fileUrl, 'video');
        
        showToast('视频上传成功');
    } catch (error) {
        console.error('上传视频失败:', error);
        showToast('上传失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

function getAreaIdByKey(key) {
    const map = {
        'splashVideo': 'splash-video-area',
        'backgroundImage': 'bg-image-area',
        'backgroundVideo': 'bg-video-area',
        'shareDefaultImage': 'share-default-image-area',
        'caseHeroImage': 'case-hero-area',
        'caseShareImage': 'case-share-image-area',
        'caseEditCover': 'case-edit-cover-area',
        'processHeroImage': 'process-hero-area',
        'materialHeroImage': 'material-hero-area'
    };
    return map[key] || '';
}

function showUploadPreview(areaId, url, type) {
    const area = document.getElementById(areaId);
    if (!area) return;
    
    const placeholder = area.querySelector('.upload-placeholder');
    const preview = area.querySelector('.upload-preview');
    
    placeholder.classList.add('hidden');
    preview.classList.remove('hidden');
    
    if (type === 'image') {
        const img = preview.querySelector('img');
        if (img) {
            img.src = url;
            img.onerror = function() {
                this.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22150%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22>图片</text></svg>';
            };
        }
    } else if (type === 'video') {
        const video = preview.querySelector('video');
        if (video) {
            video.src = url;
        }
    }
}

function clearUploadPreview(areaId) {
    const area = document.getElementById(areaId);
    if (!area) return;
    
    const placeholder = area.querySelector('.upload-placeholder');
    const preview = area.querySelector('.upload-preview');
    
    placeholder.classList.remove('hidden');
    preview.classList.add('hidden');
}

function removeUpload(key) {
    uploadedFiles[key] = null;
    const areaId = getAreaIdByKey(key);
    clearUploadPreview(areaId);
}

// ==================== 模态框 ====================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 点击模态框外部关闭
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// ==================== Toast提示 ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== 加载状态 ====================
function showLoading(show) {
    if (show) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

// ==================== 初始化全局配置 ====================
async function initGlobalConfig() {
    try {
        // 检查全局配置是否存在
        const res = await db.collection('config').doc('global').get();
        
        if (res.data.length === 0) {
            // 创建默认配置
            await db.collection('config').add({
                _id: 'global',
                backgroundType: 'image',
                backgroundImage: '',
                backgroundVideo: '',
                splash: {
                    logo: 'WENJIE AIƎR',
                    subtitle: 'AI VIDEO PRODUCTION',
                    brandText: 'WEDDING PLANNING'
                },
                home: {
                    brandName: 'WENJIE AIER',
                    brandNameCn: '问介AIer',
                    services: [
                        { name: 'AI CREATIVE', icon: 'creative' },
                        { name: 'VIDEO PRODUCTION', icon: 'video' },
                        { name: 'WEDDING PLANNING', icon: 'wedding' }
                    ]
                },
                tabBar: [
                    { icon: 'home', text: '首页', pagePath: '/pages/index/index' },
                    { icon: 'case', text: '案例', pagePath: '/pages/case/case' },
                    { icon: 'process', text: '流程', pagePath: '/pages/process/process' },
                    { icon: 'materials', text: '资料', pagePath: '/pages/materials/materials' }
                ],
                shareConfig: {
                    defaultTitle: '问介AIer - 用心记录每一份美好',
                    defaultImage: ''
                }
            });
            
            console.log('全局配置已初始化');
        }
    } catch (error) {
        console.error('初始化全局配置失败:', error);
    }
}

// 云开发初始化后调用
initCloud().then(() => {
    initGlobalConfig();
});
