# 视觉体验优化 Spec

## Why
当前过场动画科幻感不足、行星悬停信息卡片视觉风格偏普通、全屏大图模式底部名称被音乐播放器遮挡，三个问题影响整体沉浸感和可用性。

## What Changes
- 重写 UniverseIntro 过场动画，增强未来科技感视觉元素，加入数据流、HUD 扫描线、能量环等叙事性动画
- 重写 PlanetInfoCard 为全息投影风格，加入扫描线、闪烁、缩略图显示、故障效果
- 修复 HolographicViewer 全屏模式下底部照片名称被 MusicPlayer 遮挡的布局问题

## Impact
- Affected code: `UniverseIntro.tsx`, `PlanetInfoCard.tsx`, `HolographicViewer.tsx`, `index.css`

## ADDED Requirements

### Requirement: 过场动画增强
系统 SHALL 提供增强版过场动画，包含以下视觉元素：
- 数据流粒子从屏幕边缘向中心汇聚
- HUD 扫描线效果（水平线条从上到下扫描）
- 能量环脉冲扩散效果
- 系统初始化文字序列（如 "INITIALIZING QUANTUM MATRIX..." 逐字显示）
- 虫洞穿越时增加速度线拉伸效果和屏幕边缘光晕
- 整体色调从暖橙调整为冷蓝+青色，更符合科幻主题

#### Scenario: 用户进入宇宙
- **WHEN** 用户点击"点击进入你的星辰大海"
- **THEN** 依次播放：数据流汇聚 → HUD扫描 → 能量脉冲 → 系统文字 → 虫洞激活 → 超空间穿越 → 白光爆发 → 进入宇宙

### Requirement: 全息投影风格信息卡片
系统 SHALL 在行星悬停时以全息投影风格展示信息卡片，包含：
- 半透明蓝色基底 + 扫描线叠加
- 照片缩略图显示（左上角小图）
- 故障闪烁效果（随机短暂位移+色差）
- 边角装饰线条（赛博朋克风格的角标）
- 信息项带图标和全息蓝色文字
- 整体呼吸式透明度脉冲

#### Scenario: 用户悬停行星
- **WHEN** 用户将鼠标悬停在3D行星上
- **THEN** 以全息投影风格显示照片名称、日期、标签数、缩略图

### Requirement: 全屏模式名称不被遮挡
系统 SHALL 在 HolographicViewer 全屏模式下确保照片名称完整显示，不被底部 MusicPlayer 遮挡。

#### Scenario: 全屏查看照片
- **WHEN** 用户点击行星进入大图全屏模式
- **THEN** 底部照片名称区域在 MusicPlayer 上方完整显示，无视觉重叠
