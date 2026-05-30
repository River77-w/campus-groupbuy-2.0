/**
 * 校园拼单助理 - Supabase 版主逻辑
 * 所有拼单数据存储在 Supabase 云端，实现多用户共享
 */

// ==================== 配置常量 ====================
const CONFIG = {
    STORAGE_KEY: 'campus_groupbuys',
    USER_KEY: 'campus_user_data',
    CATEGORY_MAP: {
        'food': { 
            name: '外卖', 
            icon: '🍔', 
            api: '外卖',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'
        },
        'drink': { 
            name: '奶茶', 
            icon: '🧋', 
            api: '奶茶',
            image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=300&fit=crop'
        },
        'supermarket': { 
            name: '超市', 
            icon: '🛒', 
            api: '超市',
            image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop'
        },
        'other': { 
            name: '其他', 
            icon: '📦', 
            api: '其他',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'
        }
    },
    DEFAULT_IMAGE: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop',
    CAMPUS_MAP: {
        'south-1-3': '南区1-3栋',
        'south-4-6': '南区4-6栋',
        'south-7-9': '南区7-9栋',
        'south-10-12': '南区10-12栋',
        'south-13-14': '南区13-14栋',
        'north-17-21': '北区17-21栋',
        'north-24-28': '北区24-28栋',
        'north-29': '北区29栋',
        'north-zhuanjia': '北区专家楼'
    },
    AREA_MAP: {
        'south': '南区',
        'north': '北区'
    },
    CAMPUS_COORDS: {
        'south-1-3': { lat: 39.97, lng: 116.31 },
        'south-4-6': { lat: 39.97, lng: 116.32 },
        'south-7-9': { lat: 39.97, lng: 116.33 },
        'south-10-12': { lat: 39.96, lng: 116.31 },
        'south-13-14': { lat: 39.96, lng: 116.32 },
        'north-17-21': { lat: 40.00, lng: 116.31 },
        'north-24-28': { lat: 40.00, lng: 116.32 },
        'north-29': { lat: 40.01, lng: 116.31 },
        'north-zhuanjia': { lat: 40.01, lng: 116.33 }
    }
};

// ==================== 初始化 Supabase 客户端 ====================
let sb = null;

try {
    // 诊断日志：检查 SDK 和配置是否就绪
    if (typeof window.supabase === 'undefined') {
        throw new Error(
            'Supabase SDK 未加载！请检查：\n' +
            '1. index.html 中是否引入了 supabase-js\n' +
            '2. 网络是否能访问 CDN\n' +
            '3. 浏览器控制台 Network 面板查看是否 200'
        );
    }
    if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
        throw new Error('window.SUPABASE_CONFIG 未定义，请检查 index.html 中配置是否正确');
    }
    if (!window.SUPABASE_CONFIG.anonKey || window.SUPABASE_CONFIG.anonKey.length < 20) {
        throw new Error(
            'anonKey 太短或不完整！当前值: "' + window.SUPABASE_CONFIG.anonKey + '"\n' +
            '请去 Supabase 控制台 → Project Settings → API → anon public key 复制完整密钥'
        );
    }

    sb = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Supabase 客户端初始化成功');
    console.log('   URL:', window.SUPABASE_CONFIG.url);
} catch (e) {
    console.error('❌ Supabase 初始化失败:', e.message);
    // 在页面上显示错误提示，方便调试
    document.addEventListener('DOMContentLoaded', () => {
        const list = document.getElementById('groupbuyList');
        if (list) {
            list.innerHTML = `<div style="padding:40px;text-align:center;color:#e74c3c;">
                <h3>⚠️ Supabase 连接失败</h3>
                <p style="margin-top:10px;font-size:14px;color:#666;">${e.message.replace(/\n/g, '<br>')}</p>
                <p style="margin-top:10px;font-size:12px;color:#999;">请按 F12 打开控制台查看详细错误</p>
            </div>`;
        }
    });
    // 不抛异常，让后续代码安全降级（空数据）
}

// ==================== 工具函数 ====================

function generateId() {
    return 'GB_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function getBrowserId() {
    let browserId = localStorage.getItem('browser_id');
    if (!browserId) {
        browserId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('browser_id', browserId);
    }
    return browserId;
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
}

function getCountdown(endTime) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return { text: '已结束', isUrgent: false, isEnded: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) {
        return { text: `剩余 ${hours}小时${minutes}分`, isUrgent: false, isEnded: false };
    } else if (minutes > 0) {
        return { text: `剩余 ${minutes}分${seconds}秒`, isUrgent: true, isEnded: false };
    } else {
        return { text: `剩余 ${seconds}秒`, isUrgent: true, isEnded: false };
    }
}

function calculateAA(totalAmount, participantCount) {
    if (!totalAmount || !participantCount || participantCount === 0) return 0;
    return formatPrice(totalAmount / participantCount);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    toast.className = 'toast';
    if (type === 'success') toast.classList.add('success');
    if (type === 'error') toast.classList.add('error');
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textarea);
        return result;
    }
}

// ==================== Supabase 数据操作 ====================

/**
 * 获取拼单列表（支持校区和分类筛选）
 */
async function fetchGroupBuysFromAPI(campus, category) {
    if (!sb) {
        console.warn('⚠️ Supabase 未初始化，返回空数据');
        return [];
    }

    let query = sb
        .from('group_buys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (campus && campus !== 'all') {
        query = query.eq('campus', campus);
    }
    if (category && category !== 'all') {
        const categoryMap = {
            'food': '外卖',
            'drink': '奶茶',
            'supermarket': '超市',
            'other': '其他'
        };
        const dbCategory = categoryMap[category] || category;
        query = query.eq('category', dbCategory);
    }

    const { data, error } = await query;
    if (error) {
        console.error('获取拼单列表失败:', error);
        throw error;
    }
    console.log(`📋 获取到 ${data.length} 条拼单`);
    return data;
}

/**
 * 获取单个拼单详情
 */
async function fetchGroupBuyById(id) {
    if (!sb) throw new Error('Supabase 未初始化');

    const { data, error } = await sb
        .from('group_buys')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

/**
 * 创建新拼单
 */
async function createGroupBuyToAPI(groupBuy) {
    if (!sb) throw new Error('Supabase 未初始化');

    const categoryMap = {
        'food': '外卖',
        'drink': '奶茶',
        'supermarket': '超市',
        'other': '其他'
    };
    const dbCategory = categoryMap[groupBuy.category] || groupBuy.category;
    const perPrice = groupBuy.totalAmount / groupBuy.targetCount;

    const { data, error } = await sb
        .from('group_buys')
        .insert([{
            id: groupBuy.id,
            merchant: groupBuy.merchant,
            description: groupBuy.description,
            total_amount: groupBuy.totalAmount,
            target_people: groupBuy.targetCount,
            current_people: groupBuy.currentCount || 1,
            per_price: perPrice,
            deadline: groupBuy.deadline,
            campus: groupBuy.campus,
            wechat_id: groupBuy.wechatId,
            category: dbCategory,
            image: groupBuy.image || '',
            status: 'active',
            creator_id: groupBuy.creatorId || getBrowserId(),
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    console.log('✅ 拼单已发布到 Supabase:', data.id);
    return data;
}

// ==================== 用户历史（本地存储，用于推荐） ====================

function getUserData() {
    try {
        const data = localStorage.getItem(CONFIG.USER_KEY);
        return data ? JSON.parse(data) : {
            browserId: getBrowserId(),
            history: [],
            preferences: { defaultCampus: null }
        };
    } catch (e) {
        return { browserId: getBrowserId(), history: [], preferences: {} };
    }
}

function updateUserHistory(campus, category) {
    const userData = getUserData();
    const existingIndex = userData.history.findIndex(
        h => h.campus === campus && h.category === category
    );
    if (existingIndex !== -1) {
        userData.history[existingIndex].count = (userData.history[existingIndex].count || 1) + 1;
    } else {
        userData.history.push({ campus, category, count: 1 });
    }
    if (userData.history.length > 50) userData.history = userData.history.slice(-50);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
}

// ==================== 推荐算法（基于本地历史） ====================
async function loadRecommendations() {
    if (!sb) return [];

    const userData = getUserData();
    const history = userData.history;
    if (history.length === 0) return [];

    const campusCount = {}, catCount = {};
    history.forEach(record => {
        campusCount[record.campus] = (campusCount[record.campus] || 0) + 1;
        catCount[record.category] = (catCount[record.category] || 0) + 1;
    });
    const preferredCampus = Object.keys(campusCount).reduce((a,b) => campusCount[a] > campusCount[b] ? a : b, null);
    const preferredCategory = Object.keys(catCount).reduce((a,b) => catCount[a] > catCount[b] ? a : b, null);

    let query = sb.from('group_buys').select('*').eq('status', 'active');
    if (preferredCampus) query = query.eq('campus', preferredCampus);
    else if (preferredCategory) {
        const catMap = { 'food':'外卖', 'drink':'奶茶', 'supermarket':'超市', 'other':'其他' };
        query = query.eq('category', catMap[preferredCategory] || preferredCategory);
    }
    const { data, error } = await query.limit(5);
    if (error) {
        console.error('推荐查询失败:', error);
        return [];
    }
    return data;
}

// ==================== UI 渲染 ====================

function getGroupBuyImage(groupBuy) {
    if (groupBuy.image) return groupBuy.image;
    const categoryInfo = CONFIG.CATEGORY_MAP[groupBuy.category];
    return categoryInfo?.image || CONFIG.DEFAULT_IMAGE;
}

function renderGroupBuyCard(groupBuy, index) {
    const categoryInfo = CONFIG.CATEGORY_MAP[groupBuy.category] || CONFIG.CATEGORY_MAP['other'];
    const campusName = CONFIG.CAMPUS_MAP[groupBuy.campus] || groupBuy.campus;
    const perPerson = groupBuy.per_price || calculateAA(groupBuy.total_amount, groupBuy.target_people);
    const progress = (groupBuy.current_people / groupBuy.target_people) * 100;
    const countdown = getCountdown(groupBuy.deadline);
    const isEnded = groupBuy.status === 'ended' || countdown.isEnded;
    const imageUrl = getGroupBuyImage(groupBuy);
    
    const card = document.createElement('div');
    card.className = `groupbuy-card card-animation-delay-${(index % 5) + 1}${isEnded ? ' ended' : ''}`;
    card.dataset.id = groupBuy.id;
    card.innerHTML = `
        <div class="card-image" style="background-image: url('${imageUrl}')">
            <div class="card-overlay"></div>
            <div class="card-badges">
                <span class="category-badge">${categoryInfo.icon} ${categoryInfo.name}</span>
                ${isEnded ? '<span class="status-badge ended">已结束</span>' : ''}
            </div>
        </div>
        <div class="card-content">
            <div class="card-merchant">
                <span class="merchant-name">${escapeHtml(groupBuy.merchant)}</span>
                <span class="campus-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${campusName}
                </span>
            </div>
            <p class="card-description">${escapeHtml(groupBuy.description)}</p>
            <div class="card-footer">
                <div class="price-section">
                    <span class="price-current">¥${perPerson}</span>
                    <span class="price-label">/人</span>
                </div>
                <div class="progress-section">
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <span class="progress-text">${groupBuy.current_people}/${groupBuy.target_people}人</span>
                </div>
                <div class="deadline-section ${countdown.isUrgent ? 'urgent' : ''}" id="countdown-${groupBuy.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${countdown.text}</span>
                </div>
            </div>
        </div>
    `;
    card.addEventListener('click', () => openDetailModal(groupBuy.id));
    return card;
}

function renderRecommendationCard(groupBuy, index) {
    const campusName = CONFIG.CAMPUS_MAP[groupBuy.campus] || groupBuy.campus;
    const perPerson = groupBuy.per_price || calculateAA(groupBuy.total_amount, groupBuy.target_people);
    let imageUrl = groupBuy.image;
    if (!imageUrl) {
        const catInfo = CONFIG.CATEGORY_MAP[groupBuy.category];
        imageUrl = catInfo?.image || CONFIG.DEFAULT_IMAGE;
    }
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.dataset.id = groupBuy.id;
    card.innerHTML = `
        <div class="rec-image" style="background-image: url('${imageUrl}')">
            <div class="rec-overlay"></div>
            <div class="rec-content">
                <div class="rec-merchant">${escapeHtml(groupBuy.merchant)}</div>
                <div class="rec-description">${escapeHtml(groupBuy.description)}</div>
            </div>
        </div>
        <div class="rec-bottom">
            <div class="rec-footer">
                <span class="rec-price">¥${perPerson}/人</span>
                <span class="rec-campus">${campusName}</span>
            </div>
            <div class="rec-deadline" id="rec-countdown-${groupBuy.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${getCountdown(groupBuy.deadline).text}</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => openDetailModal(groupBuy.id));
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function renderGroupBuyList() {
    const listContainer = document.getElementById('groupbuyList');
    const emptyState = document.getElementById('emptyState');
    const countBadge = document.getElementById('groupbuyCount');
    const campusFilter = document.querySelector('.filter-chip.active')?.dataset.campus || 'all';
    const categoryFilter = document.getElementById('categorySelect').value;
    try {
        const groupBuys = await fetchGroupBuysFromAPI(campusFilter, categoryFilter);
        listContainer.innerHTML = '';
        if (groupBuys.length === 0) {
            emptyState.style.display = 'block';
            countBadge.textContent = '0个拼单';
        } else {
            emptyState.style.display = 'none';
            countBadge.textContent = `${groupBuys.length}个拼单`;
            groupBuys.forEach((gb, idx) => {
                listContainer.appendChild(renderGroupBuyCard(gb, idx));
            });
        }
    } catch (error) {
        console.error('渲染列表失败:', error);
        showToast('加载拼单失败', 'error');
    }
}

async function renderRecommendations() {
    const section = document.getElementById('recommendationSection');
    const list = document.getElementById('recommendationList');
    const countSpan = document.getElementById('recommendationCount');
    try {
        const recs = await loadRecommendations();
        if (recs.length === 0) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';
        countSpan.textContent = `${recs.length}个推荐`;
        list.innerHTML = '';
        recs.forEach((rec, idx) => {
            list.appendChild(renderRecommendationCard(rec, idx));
        });
    } catch (error) {
        console.error('推荐渲染失败:', error);
        section.style.display = 'none';
    }
}

// 详情页渲染
async function renderDetailContent(groupBuyId) {
    const detailContent = document.getElementById('detailContent');
    const detailModal = document.getElementById('detailModal');
    detailContent.innerHTML = '<p>加载中...</p>';
    try {
        const groupBuy = await fetchGroupBuyById(groupBuyId);
        if (!groupBuy) {
            detailContent.innerHTML = '<p>拼单不存在</p>';
            return;
        }
        const categoryInfo = CONFIG.CATEGORY_MAP[groupBuy.category] || CONFIG.CATEGORY_MAP['other'];
        const campusName = CONFIG.CAMPUS_MAP[groupBuy.campus] || groupBuy.campus;
        const perPerson = groupBuy.per_price || calculateAA(groupBuy.total_amount, groupBuy.target_people);
        const progress = (groupBuy.current_people / groupBuy.target_people) * 100;
        const countdown = getCountdown(groupBuy.deadline);
        const isEnded = groupBuy.status === 'ended' || countdown.isEnded;
        const imageUrl = getGroupBuyImage(groupBuy);
        detailModal.style.setProperty('--detail-bg-image', `url('${imageUrl}')`);
        updateUserHistory(groupBuy.campus, groupBuy.category);
        detailContent.innerHTML = `
            <div class="detail-header">
                <div class="detail-merchant">${escapeHtml(groupBuy.merchant)}</div>
                <span class="detail-category">${categoryInfo.icon} ${categoryInfo.name}</span>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">商品描述</div>
                <div class="detail-description">${escapeHtml(groupBuy.description)}</div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-item-label">总金额</div>
                    <div class="detail-item-value highlight">¥${formatPrice(groupBuy.total_amount)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">拼成后人均</div>
                    <div class="detail-item-value success">¥${perPerson}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">校区位置</div>
                    <div class="detail-item-value">${campusName}</div>
                </div>
            </div>
            <div class="progress-section">
                <div class="progress-header">
                    <span class="progress-label">参与进度</span>
                    <span class="progress-value">${groupBuy.current_people} / ${groupBuy.target_people} 人</span>
                </div>
                <div class="detail-progress-bar">
                    <div class="detail-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
            </div>
            <div class="deadline-section">
                <div class="deadline-label">截止时间</div>
                <div class="deadline-value">${formatDateTime(groupBuy.deadline)}</div>
                <div class="deadline-countdown ${countdown.isEnded ? 'ended' : ''}" id="detailCountdown">${countdown.text}</div>
            </div>
            <div class="join-section">
                <div class="wechat-display">
                    <div class="wechat-label">发起人微信号</div>
                    <div class="wechat-value" id="detailWechatId">${escapeHtml(groupBuy.wechat_id)}</div>
                </div>
                <button class="btn btn-join ${isEnded ? 'btn-secondary' : 'btn-success'}" id="joinBtn" ${isEnded ? 'disabled' : ''} data-wechat="${escapeHtml(groupBuy.wechat_id)}">
                    ${isEnded ? '拼单已结束' : '📋 复制微信号联系发起人'}
                </button>
            </div>
        `;
        const joinBtn = document.getElementById('joinBtn');
        if (joinBtn && !isEnded) {
            joinBtn.addEventListener('click', async () => {
                const wechat = joinBtn.dataset.wechat;
                if (await copyToClipboard(wechat)) {
                    showToast('微信号已复制，快去联系发起人吧！', 'success');
                } else {
                    showToast('复制失败，请长按微信号手动复制', 'error');
                }
            });
        }
        startDetailCountdown(groupBuy.deadline);
    } catch (error) {
        detailContent.innerHTML = '<p>加载失败</p>';
        console.error(error);
    }
}

function startDetailCountdown(deadline) {
    const countdownEl = document.getElementById('detailCountdown');
    if (!countdownEl) return;
    const update = () => {
        const cd = getCountdown(deadline);
        countdownEl.textContent = cd.text;
        countdownEl.className = `deadline-countdown ${cd.isEnded ? 'ended' : ''}`;
        if (!cd.isEnded) setTimeout(update, 1000);
    };
    update();
}

function updateListCountdowns() {
    document.querySelectorAll('[id^="countdown-"]').forEach(el => {
        const id = el.id.replace('countdown-', '');
        const deadlineAttr = el.closest('.groupbuy-card')?.dataset?.deadline;
        if (deadlineAttr) {
            const cd = getCountdown(deadlineAttr);
            const span = el.querySelector('span');
            if (span) span.textContent = cd.text;
            if (cd.isUrgent) el.classList.add('urgent');
            else el.classList.remove('urgent');
        }
    });
    document.querySelectorAll('[id^="rec-countdown-"]').forEach(el => {
        const id = el.id.replace('rec-countdown-', '');
        const card = el.closest('.recommendation-card');
        const deadlineAttr = card?.dataset?.deadline;
        if (deadlineAttr) {
            const cd = getCountdown(deadlineAttr);
            const span = el.querySelector('span');
            if (span) span.textContent = cd.text;
        }
    });
}

// ==================== 模态框管理 ====================

function openPublishModal() {
    const modal = document.getElementById('publishModal');
    const defaultDeadline = new Date();
    defaultDeadline.setHours(defaultDeadline.getHours() + 1);
    defaultDeadline.setMinutes(0);
    document.getElementById('deadline').value = defaultDeadline.toISOString().slice(0, 16);
    modal.classList.add('show');
}

function closePublishModal() {
    document.getElementById('publishModal').classList.remove('show');
}

async function openDetailModal(groupBuyId) {
    const modal = document.getElementById('detailModal');
    modal.classList.add('show');
    await renderDetailContent(groupBuyId);
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('show');
}

// ==================== 表单处理 ====================

async function handlePublishSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('submitPublish');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    const formData = {
        merchant: form.merchant.value.trim(),
        description: form.description.value.trim(),
        totalAmount: parseFloat(form.totalAmount.value),
        targetCount: parseInt(form.targetCount.value),
        category: form.category.value,
        deadline: form.deadline.value,
        campus: form.dormitory.value,
        wechatId: form.wechatId.value.trim(),
        image: document.getElementById('groupBuyImage').value || null
    };
    
    if (!formData.merchant || !formData.description || isNaN(formData.totalAmount) || formData.totalAmount <= 0 ||
        isNaN(formData.targetCount) || formData.targetCount < 2 || !formData.deadline || !formData.campus || !formData.wechatId) {
        showToast('请填写完整且正确的信息', 'error');
        return;
    }
    if (new Date(formData.deadline) <= new Date()) {
        showToast('截止时间必须晚于当前时间', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
        const newGroupBuy = {
            id: generateId(),
            ...formData,
            currentCount: 1,
            creatorId: getBrowserId()
        };
        await createGroupBuyToAPI(newGroupBuy);
        showToast('拼单发布成功！', 'success');
        closePublishModal();
        form.reset();
        await renderGroupBuyList();
        await renderRecommendations();
        updateUserHistory(formData.campus, formData.category);
    } catch (error) {
        console.error('发布失败:', error);
        showToast('发布失败：' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// ==================== 地理位置 ====================

function getUserLocation() {
    if (!navigator.geolocation) {
        showToast('您的浏览器不支持地理定位，请手动选择校区', 'error');
        return;
    }
    showToast('正在获取位置...', 'info');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const campus = determineCampus(latitude, longitude);
            const userData = getUserData();
            userData.preferences.defaultCampus = campus;
            userData.location = { lat: latitude, lng: longitude };
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
            showToast(`已定位到${CONFIG.CAMPUS_MAP[campus] || campus}`, 'success');
            document.getElementById('locationBtn').classList.add('active');
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.dataset.campus === campus) chip.classList.add('active');
            });
            renderGroupBuyList();
            closeLocationModal();
        },
        (error) => {
            let errorMsg = '无法获取位置';
            if (error.code === 1) errorMsg = '请允许获取位置权限，或手动选择校区';
            else if (error.code === 2) errorMsg = '无法获取当前位置，请手动选择校区';
            else if (error.code === 3) errorMsg = '获取位置超时，请手动选择校区';
            showToast(errorMsg, 'error');
            closeLocationModal();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
}

function determineCampus(lat, lng) {
    let nearest = 'south-1-3';
    let minDist = Infinity;
    for (const [campus, coords] of Object.entries(CONFIG.CAMPUS_COORDS)) {
        const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
        if (dist < minDist) { minDist = dist; nearest = campus; }
    }
    return minDist > 0.1 ? 'south-1-3' : nearest;
}

function openLocationModal() { document.getElementById('locationModal').classList.add('show'); }
function closeLocationModal() { document.getElementById('locationModal').classList.remove('show'); }

// ==================== 事件绑定 ====================

function bindEvents() {
    document.getElementById('publishBtn').addEventListener('click', openPublishModal);
    document.getElementById('closePublishModal').addEventListener('click', closePublishModal);
    document.getElementById('cancelPublish').addEventListener('click', closePublishModal);
    document.getElementById('publishForm').addEventListener('submit', handlePublishSubmit);
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
        });
    });
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderGroupBuyList();
        });
    });
    document.getElementById('categorySelect').addEventListener('change', renderGroupBuyList);
    document.getElementById('refreshBtn').addEventListener('click', () => {
        renderGroupBuyList();
        renderRecommendations();
        showToast('已刷新', 'success');
    });
    document.getElementById('locationBtn').addEventListener('click', openLocationModal);
    document.getElementById('closeLocationModal').addEventListener('click', closeLocationModal);
    document.getElementById('allowLocation').addEventListener('click', getUserLocation);
    document.getElementById('declineLocation').addEventListener('click', closeLocationModal);
    // 图片选择器逻辑
    document.querySelectorAll('.image-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.image-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            document.getElementById('groupBuyImage').value = opt.dataset.image || '';
            document.getElementById('uploadPreview').style.display = 'none';
            document.querySelector('.upload-btn').style.display = 'flex';
        });
    });
    const customUpload = document.getElementById('customImageUpload');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const removeUpload = document.getElementById('removeUpload');
    if (customUpload) {
        customUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/') && file.size <= 5*1024*1024) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    previewImage.src = ev.target.result;
                    uploadPreview.style.display = 'flex';
                    document.querySelector('.upload-btn').style.display = 'none';
                    document.querySelectorAll('.image-option').forEach(o => o.classList.remove('selected'));
                    document.getElementById('groupBuyImage').value = ev.target.result;
                };
                reader.readAsDataURL(file);
            } else if (file) showToast('图片大小不能超过5MB', 'error');
        });
    }
    if (removeUpload) {
        removeUpload.addEventListener('click', () => {
            customUpload.value = '';
            uploadPreview.style.display = 'none';
            document.querySelector('.upload-btn').style.display = 'flex';
            document.getElementById('groupBuyImage').value = '';
        });
    }
    // 键盘ESC关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
        }
    });
}

// ==================== 初始化 ====================

async function init() {
    await renderGroupBuyList();
    await renderRecommendations();
    bindEvents();
    const userData = getUserData();
    if (!userData.location && !sessionStorage.getItem('locationPromptShown')) {
        sessionStorage.setItem('locationPromptShown', 'true');
        setTimeout(() => openLocationModal(), 1000);
    }
    setInterval(() => {
        updateListCountdowns();
    }, 1000);
}

// 修复时序问题：app.js 是异步加载的，DOMContentLoaded 可能已经触发
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
