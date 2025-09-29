npx create-expo-app@latest [project-name]

package.json update script
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web", 

npx expo install @expo/ui

https://docs.expo.dev/router/advanced/native-tabs/
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

 --port=8082

# จากรากโปรเจกต์ Expo ของคุณ
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context

npx tailwindcss init


npx expo-doctor@latest
npx expo install --fix
npx expo prebuild --clean 

nativewind v4
 # จากรากโปรเจกต์ Expo ของคุณ
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context

npx tailwindcss init

tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
}


global.css
@tailwind base;
@tailwind components;
@tailwind utilities;

babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // ปล่อยว่าง plugins ได้สำหรับ Expo ปัจจุบัน (ดูหมายเหตุด้านล่าง)
  }
}

metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });


app.json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}

nativewind-env.d.ts
/// <reference types="nativewind/types" />


8) import CSS ในจุดบนสุดของแอป และทดสอบ

ใน App.tsx (หรือ root component บนสุดของคุณ):

import "./global.css";


ตัวอย่างจากเอกสาร (ทดสอบว่า className ทำงานจริง) 
nativewind.dev
สุดท้าย รันด้วยการล้างแคชสักรอบ:
npx expo start -c
