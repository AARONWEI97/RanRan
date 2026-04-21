# Tasks

- [x] Task 1: 重写 UniverseIntro 过场动画，增强科幻视觉叙事
  - [x] 1.1: 新增 DataStream 数据流粒子组件（从屏幕边缘向中心汇聚的蓝色粒子流）
  - [x] 1.2: 新增 HUDScanLines 扫描线组件（水平线条从上到下扫描，带透明度衰减）
  - [x] 1.3: 新增 EnergyPulse 能量脉冲环组件（从中心向外扩散的圆环波纹）
  - [x] 1.4: 新增 SystemBootText 系统启动文字组件（逐字显示 "INITIALIZING QUANTUM MATRIX..." 等文字序列）
  - [x] 1.5: 优化 Wormhole 虫洞组件色调（暖橙→冷蓝+青色），增加速度线拉伸效果
  - [x] 1.6: 优化 HyperspaceTunnel 超空间隧道（增加边缘光晕、拉伸线条更密集）
  - [x] 1.7: 重组动画时序：数据流→HUD扫描→能量脉冲→系统文字→虫洞→超空间→白光→完成

- [x] Task 2: 重写 PlanetInfoCard 为全息投影风格
  - [x] 2.1: 重新设计卡片布局（左上缩略图 + 右侧信息，角标装饰线）
  - [x] 2.2: 添加全息投影视觉效果（扫描线叠加、半透明蓝色基底、呼吸脉冲）
  - [x] 2.3: 添加故障闪烁效果（随机短暂位移+色差，CSS animation）
  - [x] 2.4: 在 index.css 中添加全息投影相关 CSS 动画（holo-scanline、holo-glitch、holo-pulse）

- [x] Task 3: 修复 HolographicViewer 全屏模式名称被 MusicPlayer 遮挡
  - [x] 3.1: 调整 HolographicViewer 底部名称区域的 bottom 值，增加足够间距避开 MusicPlayer 高度
  - [x] 3.2: 确保全屏和非全屏模式下名称都能完整显示

# Task Dependencies
- Task 2.4 依赖 Task 2.1-2.3（CSS 动画需配合组件结构）
- Task 1.7 依赖 Task 1.1-1.6（时序重组需所有子组件就绪）
- Task 3 独立，可并行执行
