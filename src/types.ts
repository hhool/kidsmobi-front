/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductCategory = 
  | "balance" 
  | "bicycle" 
  | "scooter" 
  | "stroller" 
  | "electric_car" 
  | "tricycle" 
  | "safety_seat" 
  | "cross_border" 
  | "industrial_belt";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  wheelSize: string; // e.g. "12寸", "14寸", "16寸", "20寸", "无"
  weight: number; // in kg
  material: string; // e.g., "航天级6061铝合金", "高端镁合金", "超轻碳纤维", "高碳钢"
  brakeType: string; // e.g., "微调短距双手刹(V刹)", "油压双碟刹", "脚踏倒刹(不推荐)", "脚踩后轮重力刹"
  tireType: string; // e.g., "越野充气橡胶胎", "EVA轻质发泡胎", "PU轮夜光减震胎"
  price: number; // e.g. 1299 (in CNY)
  ageRange: string; // e.g., "3 - 5 岁"
  heightRange: [number, number]; // e.g., [95, 115] in cm
  safetyCertification: string[]; // e.g., ["CPSC (美标)", "EN71 (欧标)", "GB 14746 (国标)"]
  safetyScore: number; // 0 - 10
  geometryScore: number; // 0 - 10 (Ergonomics, seat tube angle, bottom bracket spacing)
  weightScore: number; // 0 - 10 (Weight efficiency ratio)
  overallScore: number; // 0 - 10
  pros: string[];
  cons: string[];
  editorVerdict: string; // Final word from third-party experts
  imageUrl: string;
}

export interface ChildProfile {
  age: number;
  height: number;
  inseam: number | "";
  weight: number;
  experience: "beginner" | "intermediate" | "advanced";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
