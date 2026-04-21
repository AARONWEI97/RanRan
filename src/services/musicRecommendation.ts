import type { Photo } from '../types';

export interface MoodProfile {
  mood: string;
  energy: number;
  valence: number;
  description: string;
}

export interface MusicRecommendation {
  title: string;
  artist: string;
  mood: string;
  tags: string[];
  description: string;
}

const timeMoodMap: Record<string, MoodProfile> = {
  dawn: {
    mood: 'peaceful',
    energy: 0.3,
    valence: 0.7,
    description: '清晨宁静',
  },
  morning: {
    mood: 'energetic',
    energy: 0.6,
    valence: 0.8,
    description: '活力早晨',
  },
  afternoon: {
    mood: 'bright',
    energy: 0.7,
    valence: 0.8,
    description: '明媚午后',
  },
  evening: {
    mood: 'romantic',
    energy: 0.4,
    valence: 0.6,
    description: '浪漫黄昏',
  },
  night: {
    mood: 'melancholic',
    energy: 0.2,
    valence: 0.3,
    description: '忧郁夜晚',
  },
};

const seasonMoodMap: Record<string, MoodProfile> = {
  spring: {
    mood: 'hopeful',
    energy: 0.6,
    valence: 0.8,
    description: '希望之春',
  },
  summer: {
    mood: 'joyful',
    energy: 0.8,
    valence: 0.9,
    description: '欢乐夏日',
  },
  autumn: {
    mood: 'nostalgic',
    energy: 0.4,
    valence: 0.5,
    description: '怀旧秋日',
  },
  winter: {
    mood: 'contemplative',
    energy: 0.2,
    valence: 0.4,
    description: '沉思冬日',
  },
};

const tagMoodMap: Record<string, Partial<MoodProfile>> = {
  '旅行': { mood: 'adventurous', energy: 0.7, valence: 0.8 },
  '家庭': { mood: 'warm', energy: 0.5, valence: 0.9 },
  '朋友': { mood: 'cheerful', energy: 0.7, valence: 0.8 },
  '自然': { mood: 'peaceful', energy: 0.4, valence: 0.7 },
  '城市': { mood: 'dynamic', energy: 0.6, valence: 0.6 },
  '美食': { mood: 'joyful', energy: 0.5, valence: 0.8 },
  '宠物': { mood: 'playful', energy: 0.6, valence: 0.9 },
  '日落': { mood: 'romantic', energy: 0.3, valence: 0.6 },
  '海滩': { mood: 'relaxed', energy: 0.4, valence: 0.8 },
  '山脉': { mood: 'majestic', energy: 0.5, valence: 0.7 },
};

function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

function getSeason(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function analyzePhotoMood(photo: Photo): MoodProfile {
  const date = new Date(photo.createdAt);
  const timeOfDay = getTimeOfDay(date);
  const season = getSeason(date);
  
  const baseMood = { ...timeMoodMap[timeOfDay] };
  const seasonModifier = seasonMoodMap[season];
  
  let combinedMood: MoodProfile = {
    ...baseMood,
    energy: (baseMood.energy + seasonModifier.energy) / 2,
    valence: (baseMood.valence + seasonModifier.valence) / 2,
  };
  
  if (photo.tags && photo.tags.length > 0) {
    let tagEnergySum = 0;
    let tagValenceSum = 0;
    let tagCount = 0;
    
    for (const tag of photo.tags) {
      const tagMood = tagMoodMap[tag];
      if (tagMood) {
        tagEnergySum += tagMood.energy || 0.5;
        tagValenceSum += tagMood.valence || 0.5;
        tagCount++;
      }
    }
    
    if (tagCount > 0) {
      combinedMood.energy = (combinedMood.energy + tagEnergySum / tagCount) / 2;
      combinedMood.valence = (combinedMood.valence + tagValenceSum / tagCount) / 2;
    }
  }
  
  return combinedMood;
}

function getRecommendationForMood(mood: MoodProfile): MusicRecommendation[] {
  const recommendations: MusicRecommendation[] = [];
  
  if (mood.mood === 'peaceful' || mood.mood === 'contemplative') {
    recommendations.push(
      {
        title: '月光奏鸣曲',
        artist: '贝多芬',
        mood: 'peaceful',
        tags: ['古典', '钢琴', '安静'],
        description: '适合在宁静的夜晚聆听，让心灵得到放松',
      },
      {
        title: 'River Flows in You',
        artist: 'Yiruma',
        mood: 'contemplative',
        tags: ['钢琴', '轻音乐', '抒情'],
        description: '温柔的旋律带你进入沉思的世界',
      }
    );
  }
  
  if (mood.mood === 'energetic' || mood.mood === 'joyful') {
    recommendations.push(
      {
        title: 'Happy',
        artist: 'Pharrell Williams',
        mood: 'joyful',
        tags: ['流行', '欢快', '正能量'],
        description: '充满活力的旋律，让你一整天都充满活力',
      },
      {
        title: 'Don\'t Stop Me Now',
        artist: 'Queen',
        mood: 'energetic',
        tags: ['摇滚', '经典', '活力'],
        description: '经典摇滚，点燃你的激情',
      }
    );
  }
  
  if (mood.mood === 'romantic' || mood.mood === 'nostalgic') {
    recommendations.push(
      {
        title: 'Perfect',
        artist: 'Ed Sheeran',
        mood: 'romantic',
        tags: ['流行', '浪漫', '爱情'],
        description: '浪漫的情歌，适合在黄昏时分聆听',
      },
      {
        title: '那些花儿',
        artist: '朴树',
        mood: 'nostalgic',
        tags: ['民谣', '怀旧', '青春'],
        description: '带你回到那段美好的青春岁月',
      }
    );
  }
  
  if (mood.mood === 'adventurous' || mood.mood === 'dynamic') {
    recommendations.push(
      {
        title: 'Viva La Vida',
        artist: 'Coldplay',
        mood: 'adventurous',
        tags: ['摇滚', '史诗', '旅行'],
        description: '史诗般的旋律，陪伴你的冒险旅程',
      },
      {
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        mood: 'dynamic',
        tags: ['流行', '节奏', '动感'],
        description: '动感的节奏，让你在城市中自由穿梭',
      }
    );
  }
  
  if (mood.mood === 'warm' || mood.mood === 'cheerful') {
    recommendations.push(
      {
        title: 'Count on Me',
        artist: 'Bruno Mars',
        mood: 'warm',
        tags: ['流行', '友情', '温暖'],
        description: '温暖的旋律，感恩身边的亲朋好友',
      },
      {
        title: 'Best Day of My Life',
        artist: 'American Authors',
        mood: 'cheerful',
        tags: ['流行', '快乐', '庆祝'],
        description: '庆祝每一个美好的瞬间',
      }
    );
  }
  
  if (mood.mood === 'melancholic') {
    recommendations.push(
      {
        title: 'Someone Like You',
        artist: 'Adele',
        mood: 'melancholic',
        tags: ['流行', '伤感', '抒情'],
        description: '在夜晚的忧伤时刻，让音乐陪伴你',
      },
      {
        title: '夜空中最亮的星',
        artist: '逃跑计划',
        mood: 'melancholic',
        tags: ['摇滚', '抒情', '希望'],
        description: '在黑暗中寻找那束最亮的光',
      }
    );
  }
  
  return recommendations.slice(0, 3);
}

export function recommendMusicForPhotos(photos: Photo[]): MusicRecommendation[] {
  if (photos.length === 0) return [];
  
  const moods = photos.map(analyzePhotoMood);
  
  const avgEnergy = moods.reduce((sum, m) => sum + m.energy, 0) / moods.length;
  const avgValence = moods.reduce((sum, m) => sum + m.valence, 0) / moods.length;
  
  const dominantMood: MoodProfile = {
    mood: moods[0].mood,
    energy: avgEnergy,
    valence: avgValence,
    description: moods[0].description,
  };
  
  return getRecommendationForMood(dominantMood);
}

export function getMoodDescription(mood: MoodProfile): string {
  const energyLevel = mood.energy > 0.6 ? '充满活力' : mood.energy > 0.4 ? '平静' : '沉静';
  const valenceLevel = mood.valence > 0.7 ? '快乐' : mood.valence > 0.5 ? '温馨' : '忧郁';
  
  return `${energyLevel}的${valenceLevel}时刻`;
}

export { analyzePhotoMood };
