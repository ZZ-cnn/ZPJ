# 马卡龙糖果消消乐 (Macaron Match)

🍬 一款精美的马卡龙主题三消手游 🍭

![预览图](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## 🎮 游戏特色

### 精美界面
- 马卡龙粉紫色渐变主题
- 浮动糖果动画效果
- 流畅的消除动画

### 核心玩法
- 8×8 经典棋盘
- 6种可爱糖果角色 🍬🍭🧁🍪🍩🍫
- 交换消除、下落填充
- 特殊糖果组合

### 道具系统
| 道具 | 功能 |
|------|------|
| 💣 炸弹 | 消除 3×3 区域 |
| 🔨 锤子 | 消除单个糖果 |
| 🌈 彩虹 | 消除所有同色糖果 |

### 游戏系统
- 50 个精心设计的关卡
- 步数限制挑战
- 星星评级系统 (⭐⭐⭐)
- 目标追踪

## 🚀 运行方式

### 方法一：本地预览
```bash
# 进入项目目录
cd macaron-match

# 启动本地服务器
python -m http.server 8080
# 或
npx serve .

# 浏览器打开
http://localhost:8080
```

### 方法二：直接打开
双击 `index.html` 文件即可在浏览器中运行（部分功能可能受限）

## 📱 移动端适配

- 完美适配手机浏览器
- 支持触摸操作
- 设备振动反馈

## 🎵 音效系统

- Web Audio API 合成音效
- 可开关音效/音乐/振动
- 可调节音量大小

## 💾 数据存储

- 进度自动保存到 LocalStorage
- 设置偏好本地保存

## 📁 项目结构

```
macaron-match/
├── index.html      # 主页面
├── css/
│   └── style.css   # 样式文件
└── js/
    └── game.js     # 游戏逻辑
```

## 🛠️ 技术栈

- HTML5
- CSS3 (Flexbox, Grid, Animations)
- Vanilla JavaScript (ES6+)
- Web Audio API
- LocalStorage API
- Vibration API

## 📄 开源协议

MIT License

---

**享受游戏乐趣！🎮**
