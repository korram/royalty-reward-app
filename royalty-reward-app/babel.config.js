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
  