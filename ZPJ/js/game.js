/**
 * 马卡龙糖果消消乐 - 游戏主逻辑
 */

class MacaronMatchGame {
    constructor() {
        // 游戏配置
        this.gridSize = 8;
        this.candies = ['🍬', '🍭', '🧁', '🍪', '🍩', '🍫'];
        this.colors = ['pink', 'purple', 'yellow', 'green', 'blue', 'orange'];
        
        // 游戏状态
        this.board = [];
        this.selectedCell = null;
        this.currentLevel = 1;
        this.score = 0;
        this.moves = 0;
        this.maxMoves = 20;
        this.hearts = 5;
        this.isProcessing = false;
        this.selectedPowerUp = null;
        
        // 道具数量
        this.powerUps = {
            bomb: 3,
            hammer: 3,
            rainbow: 2
        };
        
        // 关卡目标
        this.targets = {};
        this.currentTargets = {};
        
        // 设置
        this.settings = {
            music: true,
            sound: true,
            vibrate: true,
            volume: 80
        };
        
        // 关卡数据
        this.levels = this.generateLevels();
        this.levelProgress = this.loadProgress();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadSettings();
        this.updatePowerUpDisplay();
    }
    
    // 生成关卡数据
    generateLevels() {
        const levels = [];
        for (let i = 1; i <= 50; i++) {
            const candyTypes = Math.min(4 + Math.floor(i / 10), 6);
            const targetCount = 10 + Math.floor(i / 5) * 5;
            
            levels.push({
                id: i,
                moves: 15 + Math.floor(i / 3),
                targets: this.generateTargets(candyTypes, targetCount),
                stars: [1000, 2000, 3500]
            });
        }
        return levels;
    }
    
    generateTargets(types, count) {
        const targets = {};
        const targetCandies = this.candies.slice(0, types);
        targetCandies.forEach((candy, index) => {
            if (index < 3) {
                targets[candy] = Math.floor(count / (index + 1));
            }
        });
        return targets;
    }
    
    // 本地存储
    loadProgress() {
        const saved = localStorage.getItem('macaronMatch_progress');
        if (saved) {
            return JSON.parse(saved);
        }
        return { currentLevel: 1, completed: {}, stars: {} };
    }
    
    saveProgress() {
        localStorage.setItem('macaronMatch_progress', JSON.stringify(this.levelProgress));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('macaronMatch_settings');
        if (saved) {
            this.settings = JSON.parse(saved);
            this.applySettings();
        }
    }
    
    saveSettings() {
        localStorage.setItem('macaronMatch_settings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        document.getElementById('music-toggle').checked = this.settings.music;
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('vibrate-toggle').checked = this.settings.vibrate;
        document.getElementById('volume-slider').value = this.settings.volume;
    }
    
    // 事件绑定
    bindEvents() {
        // 设置变更
        document.getElementById('music-toggle').addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('vibrate-toggle').addEventListener('change', (e) => {
            this.settings.vibrate = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.settings.volume = parseInt(e.target.value);
            this.saveSettings();
        });
    }
    
    // 屏幕切换
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    showHome() {
        this.showScreen('home-screen');
    }
    
    showLevelSelect() {
        this.renderLevelMap();
        this.showScreen('level-screen');
    }
    
    showSettings() {
        this.showScreen('settings-screen');
    }
    
    // 渲染关卡地图
    renderLevelMap() {
        const pathContainer = document.querySelector('.level-path');
        pathContainer.innerHTML = '';
        
        const maxLevel = this.levelProgress.currentLevel;
        
        for (let i = 1; i <= 20; i++) {
            // 添加关卡节点
            const node = document.createElement('div');
            node.className = 'level-node';
            
            if (i > maxLevel) {
                node.classList.add('locked');
                node.innerHTML = `<span class="level-number">🔒</span>`;
            } else if (i < maxLevel) {
                node.classList.add('completed');
                const stars = this.levelProgress.stars[i] || 0;
                node.innerHTML = `
                    <span class="level-number">${i}</span>
                    <div class="level-stars">
                        ${'⭐'.repeat(stars)}
                    </div>
                `;
                node.addEventListener('click', ((level) => () => this.startLevel(level))(i));
            } else {
                node.classList.add('current');
                node.innerHTML = `<span class="level-number">${i}</span>`;
                node.addEventListener('click', ((level) => () => this.startLevel(level))(i));
            }
            
            pathContainer.appendChild(node);
            
            // 添加连接线（除了最后一个）
            if (i < 20) {
                const connector = document.createElement('div');
                connector.className = 'level-connector';
                pathContainer.appendChild(connector);
            }
        }
        
        document.getElementById('level-hearts').textContent = this.hearts;
    }
    
    // 开始关卡
    startLevel(levelNum) {
        if (levelNum > this.levelProgress.currentLevel) return;
        
        this.currentLevel = levelNum;
        const levelData = this.levels[levelNum - 1];
        
        this.maxMoves = levelData.moves;
        this.moves = levelData.moves;
        this.score = 0;
        this.targets = { ...levelData.targets };
        this.currentTargets = { ...levelData.targets };
        
        this.updateGameUI();
        this.initBoard();
        this.showScreen('game-screen');
        
        this.playSound('start');
    }
    
    // 初始化棋盘
    initBoard() {
        this.board = [];
        const boardEl = document.getElementById('game-board');
        boardEl.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                let candy;
                do {
                    candy = this.getRandomCandy();
                } while (this.wouldCreateMatch(row, col, candy));
                
                this.board[row][col] = {
                    type: candy,
                    special: null,
                    el: this.createCellElement(row, col, candy)
                };
                
                boardEl.appendChild(this.board[row][col].el);
            }
        }
    }
    
    getRandomCandy() {
        const levelData = this.levels[this.currentLevel - 1];
        const availableCandies = this.candies.slice(0, Object.keys(levelData.targets).length + 1);
        return availableCandies[Math.floor(Math.random() * availableCandies.length)];
    }
    
    wouldCreateMatch(row, col, candy) {
        // 检查水平
        let hCount = 1;
        for (let c = col - 1; c >= 0 && this.board[row][c]?.type === candy; c--) hCount++;
        for (let c = col + 1; c < this.gridSize && this.board[row][c]?.type === candy; c++) hCount++;
        if (hCount >= 3) return true;
        
        // 检查垂直
        let vCount = 1;
        for (let r = row - 1; r >= 0 && this.board[r][col]?.type === candy; r--) vCount++;
        for (let r = row + 1; r < this.gridSize && this.board[r][col]?.type === candy; r++) vCount++;
        if (vCount >= 3) return true;
        
        return false;
    }
    
    createCellElement(row, col, candy) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.textContent = candy;
        cell.onclick = () => this.handleCellClick(row, col);
        return cell;
    }
    
    // 处理点击
    handleCellClick(row, col) {
        if (this.isProcessing) return;
        
        // 使用道具
        if (this.selectedPowerUp) {
            this.usePowerUp(row, col);
            return;
        }
        
        const cell = this.board[row][col];
        
        // 选择第一个格子
        if (!this.selectedCell) {
            this.selectedCell = { row, col };
            cell.el.classList.add('selected');
            this.playSound('select');
            return;
        }
        
        // 点击同一个格子，取消选择
        if (this.selectedCell.row === row && this.selectedCell.col === col) {
            cell.el.classList.remove('selected');
            this.selectedCell = null;
            return;
        }
        
        // 检查是否相邻
        const dr = Math.abs(this.selectedCell.row - row);
        const dc = Math.abs(this.selectedCell.col - col);
        
        if (dr + dc === 1) {
            // 相邻，尝试交换
            this.trySwap(this.selectedCell, { row, col });
        } else {
            // 不相邻，选择新格子
            this.board[this.selectedCell.row][this.selectedCell.col].el.classList.remove('selected');
            this.selectedCell = { row, col };
            cell.el.classList.add('selected');
            this.playSound('select');
        }
    }
    
    // 尝试交换
    async trySwap(cell1, cell2) {
        this.isProcessing = true;
        
        // 清除选择状态
        this.board[cell1.row][cell1.col].el.classList.remove('selected');
        this.selectedCell = null;
        
        // 交换
        this.swapCells(cell1, cell2);
        this.playSound('swap');
        
        // 检查匹配
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // 有效移动
            this.moves--;
            this.updateGameUI();
            await this.processMatches(matches);
            
            // 检查游戏结束
            this.checkGameEnd();
        } else {
            // 无效移动，交换回来
            await this.delay(200);
            this.swapCells(cell1, cell2);
            this.playSound('invalid');
            this.isProcessing = false;
        }
    }
    
    swapCells(cell1, cell2) {
        const temp = this.board[cell1.row][cell1.col];
        this.board[cell1.row][cell1.col] = this.board[cell2.row][cell2.col];
        this.board[cell2.row][cell2.col] = temp;
        
        // 更新DOM
        const boardEl = document.getElementById('game-board');
        boardEl.innerHTML = '';
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.board[row][col];
                cell.el = this.createCellElement(row, col, cell.type);
                if (cell.special) {
                    cell.el.classList.add(`special-${cell.special}`);
                }
                boardEl.appendChild(cell.el);
            }
        }
    }
    
    // 查找匹配
    findMatches() {
        const matches = [];
        const visited = new Set();
        
        // 水平匹配
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 2; col++) {
                const candy = this.board[row][col].type;
                if (candy === null) continue;
                
                let count = 1;
                let matchCells = [{ row, col }];
                
                for (let c = col + 1; c < this.gridSize && this.board[row][c].type === candy; c++) {
                    count++;
                    matchCells.push({ row, col: c });
                }
                
                if (count >= 3) {
                    matchCells.forEach(cell => {
                        const key = `${cell.row},${cell.col}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            matches.push(cell);
                        }
                    });
                }
            }
        }
        
        // 垂直匹配
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize - 2; row++) {
                const candy = this.board[row][col].type;
                if (candy === null) continue;
                
                let count = 1;
                let matchCells = [{ row, col }];
                
                for (let r = row + 1; r < this.gridSize && this.board[r][col].type === candy; r++) {
                    count++;
                    matchCells.push({ row: r, col });
                }
                
                if (count >= 3) {
                    matchCells.forEach(cell => {
                        const key = `${cell.row},${cell.col}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            matches.push(cell);
                        }
                    });
                }
            }
        }
        
        return matches;
    }
    
    // 处理匹配
    async processMatches(matches) {
        // 标记匹配的格子
        matches.forEach(({ row, col }) => {
            this.board[row][col].el.classList.add('matched');
        });
        
        // 计算分数
        const points = matches.length * 10 * (matches.length > 3 ? 2 : 1);
        this.score += points;
        
        // 更新目标
        matches.forEach(({ row, col }) => {
            const candy = this.board[row][col].type;
            if (this.currentTargets[candy] > 0) {
                this.currentTargets[candy]--;
            }
        });
        
        this.updateGameUI();
        this.playSound('match');
        this.vibrate(50);
        
        await this.delay(400);
        
        // 创建特殊糖果
        if (matches.length >= 4) {
            const center = matches[Math.floor(matches.length / 2)];
            if (matches.length >= 5) {
                this.board[center.row][center.col].special = 'rainbow';
            } else {
                this.board[center.row][center.col].special = 'bomb';
            }
        }
        
        // 清除匹配的格子
        matches.forEach(({ row, col }) => {
            this.board[row][col].type = null;
        });
        
        // 下落和填充
        await this.dropCandies();
        
        // 检查新的匹配
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await this.delay(200);
            await this.processMatches(newMatches);
        } else {
            this.isProcessing = false;
        }
    }
    
    // 糖果下落
    async dropCandies() {
        const boardEl = document.getElementById('game-board');
        
        for (let col = 0; col < this.gridSize; col++) {
            let emptyRow = this.gridSize - 1;
            
            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (this.board[row][col].type !== null) {
                    if (row !== emptyRow) {
                        this.board[emptyRow][col] = this.board[row][col];
                        this.board[row][col] = { type: null, special: null, el: null };
                    }
                    emptyRow--;
                }
            }
            
            // 填充新糖果
            for (let row = emptyRow; row >= 0; row--) {
                const candy = this.getRandomCandy();
                this.board[row][col] = {
                    type: candy,
                    special: null,
                    el: null
                };
            }
        }
        
        // 重新渲染棋盘
        boardEl.innerHTML = '';
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.board[row][col];
                cell.el = this.createCellElement(row, col, cell.type);
                if (cell.special) {
                    cell.el.classList.add(`special-${cell.special}`);
                }
                cell.el.classList.add('falling');
                boardEl.appendChild(cell.el);
            }
        }
        
        await this.delay(300);
    }
    
    // 道具系统
    selectPowerUp(type) {
        if (this.powerUps[type] <= 0) return;
        
        if (this.selectedPowerUp === type) {
            // 取消选择
            this.selectedPowerUp = null;
            document.querySelectorAll('.power-up').forEach(el => el.classList.remove('active'));
        } else {
            // 选择道具
            this.selectedPowerUp = type;
            document.querySelectorAll('.power-up').forEach(el => el.classList.remove('active'));
            document.querySelector(`[data-type="${type}"]`).classList.add('active');
            this.playSound('select');
        }
    }
    
    usePowerUp(row, col) {
        if (this.powerUps[this.selectedPowerUp] <= 0) return;
        
        this.powerUps[this.selectedPowerUp]--;
        this.updatePowerUpDisplay();
        
        const boardEl = document.getElementById('game-board');
        
        switch (this.selectedPowerUp) {
            case 'bomb':
                // 炸弹：消除3x3区域
                this.playSound('bomb');
                this.vibrate(100);
                const bombMatches = [];
                for (let r = Math.max(0, row - 1); r <= Math.min(this.gridSize - 1, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(this.gridSize - 1, col + 1); c++) {
                        bombMatches.push({ row: r, col: c });
                        this.createParticle(boardEl, r, c);
                    }
                }
                this.processMatches(bombMatches);
                break;
                
            case 'hammer':
                // 锤子：消除单个
                this.playSound('hammer');
                this.vibrate(50);
                this.createParticle(boardEl, row, col);
                this.processMatches([{ row, col }]);
                break;
                
            case 'rainbow':
                // 彩虹：消除所有同色
                this.playSound('rainbow');
                this.vibrate(150);
                const targetType = this.board[row][col].type;
                const rainbowMatches = [];
                for (let r = 0; r < this.gridSize; r++) {
                    for (let c = 0; c < this.gridSize; c++) {
                        if (this.board[r][c].type === targetType) {
                            rainbowMatches.push({ row: r, col: c });
                            this.createParticle(boardEl, r, c);
                        }
                    }
                }
                this.processMatches(rainbowMatches);
                break;
        }
        
        // 清除道具选择
        this.selectedPowerUp = null;
        document.querySelectorAll('.power-up').forEach(el => el.classList.remove('active'));
    }
    
    createParticle(container, row, col) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = '✨';
        particle.style.left = `${col * 12.5 + 6}%`;
        particle.style.top = `${row * 12.5 + 6}%`;
        particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
        particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 100}px`);
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }
    
    updatePowerUpDisplay() {
        document.getElementById('bomb-count').textContent = this.powerUps.bomb;
        document.getElementById('hammer-count').textContent = this.powerUps.hammer;
        document.getElementById('rainbow-count').textContent = this.powerUps.rainbow;
    }
    
    // 更新游戏UI
    updateGameUI() {
        document.getElementById('current-level').textContent = this.currentLevel;
        document.getElementById('moves-count').textContent = this.moves;
        document.getElementById('score-count').textContent = this.score;
        
        // 更新目标显示
        const targetContainer = document.getElementById('target-items');
        targetContainer.innerHTML = '';
        
        Object.entries(this.currentTargets).forEach(([candy, count]) => {
            const item = document.createElement('div');
            item.className = 'target-item';
            const originalCount = this.targets[candy];
            const isCompleted = count <= 0;
            
            item.innerHTML = `
                <span class="target-candy">${candy}</span>
                <span class="target-count ${isCompleted ? 'completed' : ''}">
                    ${Math.max(0, count)}/${originalCount}
                </span>
            `;
            targetContainer.appendChild(item);
        });
    }
    
    // 检查游戏结束
    checkGameEnd() {
        // 检查是否完成所有目标
        const allTargetsCompleted = Object.values(this.currentTargets).every(count => count <= 0);
        
        if (allTargetsCompleted) {
            this.endGame(true);
        } else if (this.moves <= 0) {
            this.endGame(false);
        }
    }
    
    // 游戏结束
    endGame(isWin) {
        const levelData = this.levels[this.currentLevel - 1];
        
        if (isWin) {
            // 计算星星
            let stars = 1;
            if (this.score >= levelData.stars[1]) stars = 2;
            if (this.score >= levelData.stars[2]) stars = 3;
            
            // 保存进度
            if (!this.levelProgress.stars[this.currentLevel] || 
                this.levelProgress.stars[this.currentLevel] < stars) {
                this.levelProgress.stars[this.currentLevel] = stars;
            }
            
            if (this.currentLevel >= this.levelProgress.currentLevel) {
                this.levelProgress.currentLevel = this.currentLevel + 1;
            }
            
            this.saveProgress();
            
            // 显示胜利画面
            document.getElementById('result-icon').textContent = '🏆';
            document.getElementById('result-title').textContent = '关卡完成!';
            
            // 显示星星
            const starElements = document.querySelectorAll('#stars-container .star');
            starElements.forEach((star, index) => {
                star.classList.toggle('earned', index < stars);
            });
            
            document.getElementById('btn-next').style.display = 'block';
            this.playSound('win');
            this.vibrate([100, 50, 100, 50, 200]);
        } else {
            // 显示失败画面
            document.getElementById('result-icon').textContent = '😢';
            document.getElementById('result-title').textContent = '关卡失败!';
            
            const starElements = document.querySelectorAll('#stars-container .star');
            starElements.forEach(star => star.classList.remove('earned'));
            
            document.getElementById('btn-next').style.display = 'none';
            this.hearts--;
            this.playSound('lose');
            this.vibrate([200, 100, 200]);
        }
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-moves').textContent = this.moves;
        
        this.showScreen('result-screen');
    }
    
    // 下一关
    nextLevel() {
        if (this.currentLevel < 50) {
            this.startLevel(this.currentLevel + 1);
        } else {
            this.showLevelSelect();
        }
    }
    
    // 重玩
    replayLevel() {
        this.startLevel(this.currentLevel);
    }
    
    // 暂停
    showPause() {
        document.getElementById('pause-modal').classList.add('active');
    }
    
    resumeGame() {
        document.getElementById('pause-modal').classList.remove('active');
    }
    
    // 音效和振动
    playSound(type) {
        if (!this.settings.sound) return;
        
        // 使用 Web Audio API 生成简单音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const volume = this.settings.volume / 100;
        
        switch (type) {
            case 'select':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1 * volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'swap':
                oscillator.frequency.value = 400;
                gainNode.gain.setValueAtTime(0.1 * volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
            case 'match':
                oscillator.frequency.value = 600;
                gainNode.gain.setValueAtTime(0.15 * volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'bomb':
                oscillator.frequency.value = 200;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.2 * volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case 'win':
                this.playMelody(audioContext, [523, 659, 784, 1047], volume);
                break;
            case 'lose':
                this.playMelody(audioContext, [523, 466, 415, 392], volume);
                break;
        }
    }
    
    playMelody(audioContext, frequencies, volume) {
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            gainNode.gain.setValueAtTime(0.15 * volume, audioContext.currentTime + index * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.15 + 0.14);
            
            oscillator.start(audioContext.currentTime + index * 0.15);
            oscillator.stop(audioContext.currentTime + index * 0.15 + 0.15);
        });
    }
    
    vibrate(pattern) {
        if (this.settings.vibrate && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    // 工具函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 启动游戏
const game = new MacaronMatchGame();
