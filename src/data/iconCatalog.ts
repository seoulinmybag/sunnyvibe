// 처음엔 변환 스크립트가 만들었지만, 이후로는 손으로 관리한다.
// 아이콘을 빼거나 이름을 바꿀 때는 여기와 src/assets/icons/ 의 파일을 같이 손봐야 한다.
import type { ArtSpec } from './icons';

export const ART_CATEGORIES: Array<{ folder: string; category: string; hidden?: boolean; items: ArtSpec[] }> = [
  {
    // 고인 표시에 쓰는 국화꽃. 꾸미기 목록에는 띄우지 않지만 아이콘으로는 등록해 둬야
    // 브라우저가 id만 보고 그림을 찾아 준다(시안 데이터에 이미지가 실리지 않는다).
    "folder": "system",
    "category": "시스템",
    "hidden": true,
    "items": [
      {
        "slug": "system-01",
        "label": "국화꽃",
        "width": 400,
        "height": 400,
        "recolorable": true,
        "defaultColor": "#000000"
      }
    ]
  },
  {
    "folder": "wedding",
    "category": "웨딩",
    "items": [
      {
        "slug": "wedding-01",
        "label": "웨딩 자물쇠",
        "width": 400,
        "height": 343
      },
      {
        "slug": "wedding-02",
        "label": "웨딩교회",
        "width": 341,
        "height": 400
      },
      {
        "slug": "wedding-03",
        "label": "웨딩규듀",
        "width": 400,
        "height": 315
      },
      {
        "slug": "wedding-04",
        "label": "웨딩다발",
        "width": 331,
        "height": 400
      },
      {
        "slug": "wedding-05",
        "label": "웨딩드레스",
        "width": 288,
        "height": 400
      },
      {
        "slug": "wedding-06",
        "label": "웨딩링",
        "width": 400,
        "height": 386
      },
      {
        "slug": "wedding-07",
        "label": "웨딩박스",
        "width": 400,
        "height": 343
      },
      {
        "slug": "wedding-08",
        "label": "웨딩반짝링",
        "width": 318,
        "height": 400
      },
      {
        "slug": "wedding-09",
        "label": "웨딩손",
        "width": 400,
        "height": 228
      },
      {
        "slug": "wedding-10",
        "label": "웨딩잔",
        "width": 394,
        "height": 400
      },
      {
        "slug": "wedding-11",
        "label": "웨딩종",
        "width": 344,
        "height": 400
      },
      {
        "slug": "wedding-12",
        "label": "웨딩차",
        "width": 400,
        "height": 201
      },
      {
        "slug": "wedding-13",
        "label": "웨딩책",
        "width": 338,
        "height": 400
      },
      {
        "slug": "wedding-14",
        "label": "웨딩카메라",
        "width": 400,
        "height": 314
      },
      {
        "slug": "wedding-15",
        "label": "웨딩케이크",
        "width": 382,
        "height": 400
      },
      {
        "slug": "wedding-16",
        "label": "웨딩턱시도",
        "width": 314,
        "height": 400
      },
      {
        "slug": "wedding-17",
        "label": "웨딩편지",
        "width": 400,
        "height": 359
      }
    ]
  },
  {
    "folder": "wedding3d",
    "category": "웨딩 3D",
    "items": [
      {
        "slug": "wedding3d-01",
        "label": "그린 하트",
        "width": 400,
        "height": 353
      },
      {
        "slug": "wedding3d-02",
        "label": "노란색 하트",
        "width": 400,
        "height": 362
      },
      {
        "slug": "wedding3d-03",
        "label": "두 개의 하트",
        "width": 400,
        "height": 277
      },
      {
        "slug": "wedding3d-04",
        "label": "반지를 교환하는 웨딩 한국인 커플, 안경삭제",
        "width": 400,
        "height": 379
      },
      {
        "slug": "wedding3d-05",
        "label": "반지를 교환하는 웨딩 한국인 커플",
        "width": 400,
        "height": 369
      },
      {
        "slug": "wedding3d-06",
        "label": "베일 쓴 신부",
        "width": 346,
        "height": 400
      },
      {
        "slug": "wedding3d-07",
        "label": "볼에 키스하는 한국인 웨딩 커플",
        "width": 400,
        "height": 367
      },
      {
        "slug": "wedding3d-08",
        "label": "볼에 키스하는 한국인 커플",
        "width": 400,
        "height": 382
      },
      {
        "slug": "wedding3d-09",
        "label": "부케를 던지는 신부",
        "width": 400,
        "height": 377
      },
      {
        "slug": "wedding3d-10",
        "label": "부케를 던지는 한국인 신부",
        "width": 395,
        "height": 400
      },
      {
        "slug": "wedding3d-11",
        "label": "샴페인 병",
        "width": 400,
        "height": 399
      },
      {
        "slug": "wedding3d-12",
        "label": "손잡은 신랑신부",
        "width": 357,
        "height": 400
      },
      {
        "slug": "wedding3d-13",
        "label": "손잡은 한국인 신랑신부",
        "width": 400,
        "height": 391
      },
      {
        "slug": "wedding3d-14",
        "label": "신부를 안아 든 한국인 신랑",
        "width": 390,
        "height": 400
      },
      {
        "slug": "wedding3d-15",
        "label": "연분홍색 하트",
        "width": 400,
        "height": 367
      },
      {
        "slug": "wedding3d-16",
        "label": "웨딩 다이아몬드 링",
        "width": 340,
        "height": 400
      },
      {
        "slug": "wedding3d-17",
        "label": "웨딩 보석 왕관 티아라",
        "width": 400,
        "height": 317
      },
      {
        "slug": "wedding3d-18",
        "label": "웨딩 부케",
        "width": 400,
        "height": 399
      },
      {
        "slug": "wedding3d-19",
        "label": "웨딩 촛대",
        "width": 362,
        "height": 400
      },
      {
        "slug": "wedding3d-20",
        "label": "웨딩 핑크 케이크",
        "width": 400,
        "height": 389
      },
      {
        "slug": "wedding3d-21",
        "label": "웨딩드레스 신부",
        "width": 340,
        "height": 400
      },
      {
        "slug": "wedding3d-22",
        "label": "웨딩드레스",
        "width": 368,
        "height": 400
      },
      {
        "slug": "wedding3d-23",
        "label": "웨딩링",
        "width": 362,
        "height": 400
      },
      {
        "slug": "wedding3d-24",
        "label": "웨딩슈즈",
        "width": 400,
        "height": 380
      },
      {
        "slug": "wedding3d-25",
        "label": "웨딩슈즈",
        "width": 400,
        "height": 349
      },
      {
        "slug": "wedding3d-26",
        "label": "웨딩카 오픈카",
        "width": 398,
        "height": 400
      },
      {
        "slug": "wedding3d-27",
        "label": "웨딩케이크",
        "width": 394,
        "height": 400
      },
      {
        "slug": "wedding3d-28",
        "label": "턱시도",
        "width": 400,
        "height": 385
      },
      {
        "slug": "wedding3d-29",
        "label": "티아라",
        "width": 400,
        "height": 313
      },
      {
        "slug": "wedding3d-30",
        "label": "하늘색 하트",
        "width": 400,
        "height": 365
      },
      {
        "slug": "wedding3d-31",
        "label": "하얀색 하트가 반으로 쪼개진 것. 갈라진 것 말고, 하트 반쪽. 반쪽 하트",
        "width": 400,
        "height": 361
      },
      {
        "slug": "wedding3d-32",
        "label": "하트",
        "width": 400,
        "height": 355
      },
      {
        "slug": "wedding3d-33",
        "label": "한국인 신랑",
        "width": 328,
        "height": 400
      },
      {
        "slug": "wedding3d-34",
        "label": "한국인 웨딩드레스 신부",
        "width": 378,
        "height": 400
      },
      {
        "slug": "wedding3d-35",
        "label": "한국인 턱시도 신랑",
        "width": 373,
        "height": 400
      },
      {
        "slug": "wedding3d-36",
        "label": "화이트 웨딩 부케",
        "width": 361,
        "height": 400
      },
      {
        "slug": "wedding3d-37",
        "label": "흰색 부케를 던지는 한국인 신부",
        "width": 400,
        "height": 391
      }
    ]
  },
  {
    "folder": "flower",
    "category": "꾸미기",
    "items": [
      {
        "slug": "flower-04",
        "label": "꽃",
        "width": 400,
        "height": 362,
        "recolorable": true,
        "defaultColor": "#caf0af"
      },
      {
        "slug": "flower-15",
        "label": "왕관",
        "width": 400,
        "height": 359,
        "recolorable": true,
        "defaultColor": "#a0d4f5"
      },
      {
        "slug": "flower-19",
        "label": "왕관2",
        "width": 351,
        "height": 400,
        "recolorable": true,
        "defaultColor": "#f1bdd8"
      }
    ]
  },
  {
    "folder": "weather",
    "category": "날씨",
    "items": [
      {
        "slug": "weather-01",
        "label": "날씨 빨간해",
        "width": 400,
        "height": 376
      },
      {
        "slug": "weather-02",
        "label": "날씨구름",
        "width": 400,
        "height": 266
      },
      {
        "slug": "weather-03",
        "label": "날씨구름눈",
        "width": 400,
        "height": 368
      },
      {
        "slug": "weather-04",
        "label": "날씨구름별",
        "width": 400,
        "height": 332
      },
      {
        "slug": "weather-05",
        "label": "날씨구름비",
        "width": 342,
        "height": 400
      },
      {
        "slug": "weather-06",
        "label": "날씨구름비2",
        "width": 395,
        "height": 400
      },
      {
        "slug": "weather-07",
        "label": "날씨구름해",
        "width": 400,
        "height": 390
      },
      {
        "slug": "weather-08",
        "label": "날씨눈",
        "width": 391,
        "height": 400
      },
      {
        "slug": "weather-09",
        "label": "날씨달",
        "width": 364,
        "height": 400
      },
      {
        "slug": "weather-10",
        "label": "날씨달별",
        "width": 400,
        "height": 329
      },
      {
        "slug": "weather-11",
        "label": "날씨먹구름",
        "width": 400,
        "height": 252
      },
      {
        "slug": "weather-12",
        "label": "날씨무지개",
        "width": 400,
        "height": 202
      },
      {
        "slug": "weather-13",
        "label": "날씨바람",
        "width": 400,
        "height": 225
      },
      {
        "slug": "weather-14",
        "label": "날씨반짝",
        "width": 394,
        "height": 400
      },
      {
        "slug": "weather-15",
        "label": "날씨번개",
        "width": 313,
        "height": 400
      },
      {
        "slug": "weather-16",
        "label": "날씨별",
        "width": 400,
        "height": 378
      },
      {
        "slug": "weather-17",
        "label": "날씨비",
        "width": 400,
        "height": 365
      },
      {
        "slug": "weather-18",
        "label": "날씨온도계",
        "width": 181,
        "height": 400
      },
      {
        "slug": "weather-19",
        "label": "날씨우산",
        "width": 317,
        "height": 400
      },
      {
        "slug": "weather-20",
        "label": "날씨웅덩이",
        "width": 400,
        "height": 241
      },
      {
        "slug": "weather-21",
        "label": "날씨일몰",
        "width": 400,
        "height": 274
      },
      {
        "slug": "weather-22",
        "label": "날씨하얀구름",
        "width": 400,
        "height": 232
      },
      {
        "slug": "weather-23",
        "label": "날씨해",
        "width": 399,
        "height": 400
      },
      {
        "slug": "weather-24",
        "label": "날씨회오리",
        "width": 350,
        "height": 400
      }
    ]
  },
  {
    "folder": "animal",
    "category": "동물",
    "items": [
      {
        "slug": "animal-01",
        "label": "강아지",
        "width": 400,
        "height": 258
      },
      {
        "slug": "animal-02",
        "label": "개구리",
        "width": 400,
        "height": 344
      },
      {
        "slug": "animal-03",
        "label": "거북이",
        "width": 400,
        "height": 247
      },
      {
        "slug": "animal-04",
        "label": "고슴도치",
        "width": 400,
        "height": 320
      },
      {
        "slug": "animal-05",
        "label": "고양이1",
        "width": 400,
        "height": 327
      },
      {
        "slug": "animal-06",
        "label": "사슴",
        "width": 346,
        "height": 400
      },
      {
        "slug": "animal-07",
        "label": "기린2",
        "width": 256,
        "height": 400
      },
      {
        "slug": "animal-08",
        "label": "당나귀",
        "width": 376,
        "height": 400
      },
      {
        "slug": "animal-09",
        "label": "돌고래",
        "width": 400,
        "height": 195
      },
      {
        "slug": "animal-10",
        "label": "돌고래2",
        "width": 400,
        "height": 361
      },
      {
        "slug": "animal-11",
        "label": "병아리",
        "width": 322,
        "height": 400
      },
      {
        "slug": "animal-12",
        "label": "양",
        "width": 371,
        "height": 400
      },
      {
        "slug": "animal-13",
        "label": "얼룩말",
        "width": 392,
        "height": 400
      },
      {
        "slug": "animal-15",
        "label": "여우2",
        "width": 400,
        "height": 352
      },
      {
        "slug": "animal-17",
        "label": "코뿔소",
        "width": 400,
        "height": 276
      },
      {
        "slug": "animal-18",
        "label": "쿄끼리",
        "width": 400,
        "height": 277
      },
      {
        "slug": "animal-19",
        "label": "토끼",
        "width": 321,
        "height": 400
      },
      {
        "slug": "animal-21",
        "label": "홍학",
        "width": 330,
        "height": 400
      }
    ]
  },
  {
    "folder": "food",
    "category": "음식",
    "items": [
      {
        "slug": "food-01",
        "label": "갈비",
        "width": 400,
        "height": 240
      },
      {
        "slug": "food-02",
        "label": "감자튀김",
        "width": 328,
        "height": 400
      },
      {
        "slug": "food-03",
        "label": "고기",
        "width": 246,
        "height": 400
      },
      {
        "slug": "food-04",
        "label": "우유",
        "width": 243,
        "height": 400
      },
      {
        "slug": "food-05",
        "label": "기본푸딩",
        "width": 400,
        "height": 283
      },
      {
        "slug": "food-06",
        "label": "김밥앤초밥",
        "width": 400,
        "height": 334
      },
      {
        "slug": "food-07",
        "label": "꿔바로우",
        "width": 400,
        "height": 317
      },
      {
        "slug": "food-08",
        "label": "당근",
        "width": 400,
        "height": 389
      },
      {
        "slug": "food-09",
        "label": "도너츠",
        "width": 400,
        "height": 340
      },
      {
        "slug": "food-10",
        "label": "딸기",
        "width": 337,
        "height": 400
      },
      {
        "slug": "food-12",
        "label": "떡볶이그릇",
        "width": 400,
        "height": 252
      },
      {
        "slug": "food-13",
        "label": "레몬",
        "width": 400,
        "height": 297
      },
      {
        "slug": "food-15",
        "label": "마라탕 _ 찌개",
        "width": 400,
        "height": 260
      },
      {
        "slug": "food-16",
        "label": "마카롱",
        "width": 400,
        "height": 343
      },
      {
        "slug": "food-17",
        "label": "만두",
        "width": 400,
        "height": 294
      },
      {
        "slug": "food-18",
        "label": "바나나",
        "width": 400,
        "height": 400
      },
      {
        "slug": "food-19",
        "label": "복숭아",
        "width": 400,
        "height": 362
      },
      {
        "slug": "food-20",
        "label": "빵",
        "width": 400,
        "height": 265
      },
      {
        "slug": "food-21",
        "label": "수박",
        "width": 400,
        "height": 284
      },
      {
        "slug": "food-22",
        "label": "순대",
        "width": 400,
        "height": 280
      },
      {
        "slug": "food-23",
        "label": "앵두",
        "width": 400,
        "height": 360
      },
      {
        "slug": "food-24",
        "label": "앵두타르트",
        "width": 400,
        "height": 253
      },
      {
        "slug": "food-25",
        "label": "우유",
        "width": 377,
        "height": 400
      },
      {
        "slug": "food-26",
        "label": "김밥",
        "width": 400,
        "height": 283
      },
      {
        "slug": "food-27",
        "label": "자른수박",
        "width": 400,
        "height": 358
      },
      {
        "slug": "food-28",
        "label": "족발",
        "width": 400,
        "height": 278
      },
      {
        "slug": "food-29",
        "label": "쥬스",
        "width": 326,
        "height": 400
      },
      {
        "slug": "food-30",
        "label": "짜장면",
        "width": 400,
        "height": 318
      },
      {
        "slug": "food-31",
        "label": "짬뽕",
        "width": 400,
        "height": 300
      },
      {
        "slug": "food-32",
        "label": "초코",
        "width": 400,
        "height": 323
      },
      {
        "slug": "food-33",
        "label": "치즈",
        "width": 400,
        "height": 341
      },
      {
        "slug": "food-34",
        "label": "치킨",
        "width": 400,
        "height": 319
      },
      {
        "slug": "food-35",
        "label": "컵케이크",
        "width": 328,
        "height": 400
      },
      {
        "slug": "food-36",
        "label": "케이크",
        "width": 400,
        "height": 354
      },
      {
        "slug": "food-37",
        "label": "탕후루",
        "width": 169,
        "height": 400
      },
      {
        "slug": "food-38",
        "label": "프레첼",
        "width": 400,
        "height": 313
      },
      {
        "slug": "food-39",
        "label": "포도",
        "width": 400,
        "height": 365
      },
      {
        "slug": "food-41",
        "label": "푸딩",
        "width": 400,
        "height": 328
      },
      {
        "slug": "food-42",
        "label": "피자",
        "width": 400,
        "height": 355
      },
      {
        "slug": "food-43",
        "label": "햄버거",
        "width": 400,
        "height": 349
      }
    ]
  },
  {
    "folder": "hobby",
    "category": "취미",
    "items": [
      {
        "slug": "hobby-01",
        "label": "기타",
        "width": 287,
        "height": 400
      },
      {
        "slug": "hobby-02",
        "label": "꽃",
        "width": 400,
        "height": 332
      },
      {
        "slug": "hobby-03",
        "label": "낚시",
        "width": 276,
        "height": 400
      },
      {
        "slug": "hobby-04",
        "label": "농구공",
        "width": 391,
        "height": 400
      },
      {
        "slug": "hobby-05",
        "label": "등산가방",
        "width": 345,
        "height": 400
      },
      {
        "slug": "hobby-06",
        "label": "등산신발",
        "width": 400,
        "height": 325
      },
      {
        "slug": "hobby-07",
        "label": "보드",
        "width": 400,
        "height": 363
      },
      {
        "slug": "hobby-08",
        "label": "불멍",
        "width": 286,
        "height": 400
      },
      {
        "slug": "hobby-09",
        "label": "산",
        "width": 400,
        "height": 266
      },
      {
        "slug": "hobby-10",
        "label": "쇼핑백",
        "width": 346,
        "height": 400
      },
      {
        "slug": "hobby-11",
        "label": "스케이트 보드",
        "width": 400,
        "height": 263
      },
      {
        "slug": "hobby-12",
        "label": "실",
        "width": 400,
        "height": 320
      },
      {
        "slug": "hobby-13",
        "label": "야구",
        "width": 400,
        "height": 309
      },
      {
        "slug": "hobby-14",
        "label": "오락기",
        "width": 400,
        "height": 331
      },
      {
        "slug": "hobby-15",
        "label": "자전거",
        "width": 400,
        "height": 341
      },
      {
        "slug": "hobby-16",
        "label": "축구",
        "width": 400,
        "height": 395
      },
      {
        "slug": "hobby-17",
        "label": "침낭",
        "width": 374,
        "height": 400
      },
      {
        "slug": "hobby-18",
        "label": "카메라",
        "width": 400,
        "height": 310
      },
      {
        "slug": "hobby-19",
        "label": "캐리어",
        "width": 232,
        "height": 400
      },
      {
        "slug": "hobby-20",
        "label": "텐트",
        "width": 400,
        "height": 232
      }
    ]
  },
  {
    "folder": "crayon",
    "category": "크레용",
    "items": [
      {
        "slug": "crayon-01",
        "label": "해",
        "width": 213,
        "height": 222
      },
      {
        "slug": "crayon-02",
        "label": "자는 달",
        "width": 168,
        "height": 186
      },
      {
        "slug": "crayon-03",
        "label": "별똥별",
        "width": 226,
        "height": 202
      },
      {
        "slug": "crayon-04",
        "label": "로켓",
        "width": 159,
        "height": 239
      },
      {
        "slug": "crayon-05",
        "label": "토성",
        "width": 233,
        "height": 174
      },
      {
        "slug": "crayon-06",
        "label": "비구름",
        "width": 190,
        "height": 198
      },
      {
        "slug": "crayon-07",
        "label": "무지개",
        "width": 213,
        "height": 183
      },
      {
        "slug": "crayon-08",
        "label": "나비",
        "width": 191,
        "height": 216
      },
      {
        "slug": "crayon-09",
        "label": "꿀벌",
        "width": 194,
        "height": 219
      },
      {
        "slug": "crayon-10",
        "label": "무당벌레",
        "width": 191,
        "height": 184
      },
      {
        "slug": "crayon-11",
        "label": "고양이",
        "width": 224,
        "height": 220
      },
      {
        "slug": "crayon-12",
        "label": "강아지",
        "width": 194,
        "height": 203
      },
      {
        "slug": "crayon-13",
        "label": "새",
        "width": 213,
        "height": 178
      },
      {
        "slug": "crayon-14",
        "label": "거북이",
        "width": 233,
        "height": 170
      },
      {
        "slug": "crayon-15",
        "label": "물고기",
        "width": 207,
        "height": 182
      },
      {
        "slug": "crayon-16",
        "label": "데이지",
        "width": 181,
        "height": 231
      },
      {
        "slug": "crayon-17",
        "label": "튤립",
        "width": 188,
        "height": 205
      },
      {
        "slug": "crayon-18",
        "label": "과일나무",
        "width": 193,
        "height": 223
      },
      {
        "slug": "crayon-19",
        "label": "사과",
        "width": 184,
        "height": 185
      },
      {
        "slug": "crayon-20",
        "label": "딸기",
        "width": 172,
        "height": 196
      },
      {
        "slug": "crayon-21",
        "label": "버섯",
        "width": 185,
        "height": 173
      },
      {
        "slug": "crayon-22",
        "label": "나뭇잎",
        "width": 172,
        "height": 185
      },
      {
        "slug": "crayon-23",
        "label": "집",
        "width": 197,
        "height": 187
      },
      {
        "slug": "crayon-24",
        "label": "자동차",
        "width": 204,
        "height": 154
      },
      {
        "slug": "crayon-25",
        "label": "돛단배",
        "width": 192,
        "height": 210
      },
      {
        "slug": "crayon-26",
        "label": "아이스크림",
        "width": 122,
        "height": 216
      },
      {
        "slug": "crayon-27",
        "label": "연",
        "width": 189,
        "height": 218
      },
      {
        "slug": "crayon-28",
        "label": "풍선",
        "width": 145,
        "height": 205
      },
      {
        "slug": "crayon-29",
        "label": "물뿌리개",
        "width": 233,
        "height": 163
      },
      {
        "slug": "crayon-30",
        "label": "달팽이",
        "width": 198,
        "height": 177
      }
    ]
  },
  {
    "folder": "retro",
    "category": "추억",
    "items": [
      {
        "slug": "retro-01",
        "label": "다마고찌",
        "width": 177,
        "height": 210
      },
      {
        "slug": "retro-02",
        "label": "국어교과서",
        "width": 187,
        "height": 206
      },
      {
        "slug": "retro-03",
        "label": "잠자리채",
        "width": 197,
        "height": 218
      },
      {
        "slug": "retro-04",
        "label": "달고나",
        "width": 181,
        "height": 174
      },
      {
        "slug": "retro-05",
        "label": "공깃돌",
        "width": 186,
        "height": 190
      },
      {
        "slug": "retro-06",
        "label": "구슬주머니",
        "width": 199,
        "height": 201
      },
      {
        "slug": "retro-07",
        "label": "종이딱지",
        "width": 187,
        "height": 184
      },
      {
        "slug": "retro-08",
        "label": "지우개청소기",
        "width": 212,
        "height": 158
      },
      {
        "slug": "retro-09",
        "label": "멀티펜",
        "width": 192,
        "height": 199
      },
      {
        "slug": "retro-10",
        "label": "향기지우개",
        "width": 193,
        "height": 158
      },
      {
        "slug": "retro-11",
        "label": "자물쇠일기장",
        "width": 182,
        "height": 204
      },
      {
        "slug": "retro-12",
        "label": "자석필통",
        "width": 221,
        "height": 166
      },
      {
        "slug": "retro-13",
        "label": "슬랩팔찌",
        "width": 173,
        "height": 173
      },
      {
        "slug": "retro-14",
        "label": "롤러스케이트",
        "width": 189,
        "height": 200
      },
      {
        "slug": "retro-15",
        "label": "줄무늬실내화",
        "width": 212,
        "height": 174
      },
      {
        "slug": "retro-16",
        "label": "리코더",
        "width": 189,
        "height": 208
      },
      {
        "slug": "retro-17",
        "label": "물방울링게임기",
        "width": 173,
        "height": 208
      },
      {
        "slug": "retro-18",
        "label": "요요",
        "width": 187,
        "height": 181
      },
      {
        "slug": "retro-19",
        "label": "비눗방울",
        "width": 175,
        "height": 200
      },
      {
        "slug": "retro-20",
        "label": "종이인형",
        "width": 223,
        "height": 210
      },
      {
        "slug": "retro-21",
        "label": "카세트플레이어",
        "width": 209,
        "height": 202
      },
      {
        "slug": "retro-22",
        "label": "플로피디스크",
        "width": 177,
        "height": 177
      },
      {
        "slug": "retro-23",
        "label": "빨대과자",
        "width": 192,
        "height": 219
      },
      {
        "slug": "retro-24",
        "label": "쫀드기",
        "width": 191,
        "height": 220
      },
      {
        "slug": "retro-25",
        "label": "떡꼬치",
        "width": 179,
        "height": 209
      },
      {
        "slug": "retro-26",
        "label": "컵떡볶이",
        "width": 183,
        "height": 214
      },
      {
        "slug": "retro-27",
        "label": "병우유",
        "width": 106,
        "height": 212
      },
      {
        "slug": "retro-28",
        "label": "급식판",
        "width": 224,
        "height": 180
      },
      {
        "slug": "retro-29",
        "label": "엠피쓰리플레이어",
        "width": 196,
        "height": 187
      },
      {
        "slug": "retro-30",
        "label": "폴더폰",
        "width": 163,
        "height": 223
      }
    ]
  },
  {
    "folder": "doodle",
    "category": "색연필",
    "items": [
      {
        "slug": "doodle-01",
        "label": "춤추는아이",
        "width": 209,
        "height": 240
      },
      {
        "slug": "doodle-02",
        "label": "달리는아이",
        "width": 191,
        "height": 233
      },
      {
        "slug": "doodle-03",
        "label": "꼬마요리사",
        "width": 169,
        "height": 239
      },
      {
        "slug": "doodle-04",
        "label": "킥보드타는아이",
        "width": 173,
        "height": 239
      },
      {
        "slug": "doodle-05",
        "label": "책읽는아이",
        "width": 141,
        "height": 200
      },
      {
        "slug": "doodle-06",
        "label": "줄넘기하는아이",
        "width": 192,
        "height": 240
      },
      {
        "slug": "doodle-07",
        "label": "생일케이크",
        "width": 165,
        "height": 193
      },
      {
        "slug": "doodle-08",
        "label": "초코칩쿠키",
        "width": 173,
        "height": 165
      },
      {
        "slug": "doodle-09",
        "label": "샌드위치",
        "width": 202,
        "height": 160
      },
      {
        "slug": "doodle-10",
        "label": "햄버거",
        "width": 176,
        "height": 161
      },
      {
        "slug": "doodle-11",
        "label": "포장사탕",
        "width": 221,
        "height": 170
      },
      {
        "slug": "doodle-12",
        "label": "막대사탕",
        "width": 131,
        "height": 195
      },
      {
        "slug": "doodle-13",
        "label": "팝콘",
        "width": 157,
        "height": 192
      },
      {
        "slug": "doodle-14",
        "label": "도넛",
        "width": 183,
        "height": 160
      },
      {
        "slug": "doodle-15",
        "label": "주스팩",
        "width": 137,
        "height": 197
      },
      {
        "slug": "doodle-16",
        "label": "왕관",
        "width": 175,
        "height": 155
      },
      {
        "slug": "doodle-17",
        "label": "장난감북",
        "width": 162,
        "height": 192
      },
      {
        "slug": "doodle-18",
        "label": "팽이",
        "width": 157,
        "height": 192
      },
      {
        "slug": "doodle-19",
        "label": "쌓기블록",
        "width": 187,
        "height": 170
      },
      {
        "slug": "doodle-20",
        "label": "곰인형",
        "width": 185,
        "height": 188
      },
      {
        "slug": "doodle-21",
        "label": "공",
        "width": 170,
        "height": 162
      },
      {
        "slug": "doodle-22",
        "label": "모래놀이세트",
        "width": 187,
        "height": 184
      },
      {
        "slug": "doodle-23",
        "label": "미끄럼틀",
        "width": 214,
        "height": 173
      },
      {
        "slug": "doodle-24",
        "label": "그네",
        "width": 192,
        "height": 176
      },
      {
        "slug": "doodle-25",
        "label": "책가방",
        "width": 183,
        "height": 195
      },
      {
        "slug": "doodle-26",
        "label": "크레파스",
        "width": 179,
        "height": 188
      },
      {
        "slug": "doodle-27",
        "label": "가위",
        "width": 198,
        "height": 159
      },
      {
        "slug": "doodle-28",
        "label": "풀",
        "width": 103,
        "height": 195
      },
      {
        "slug": "doodle-29",
        "label": "물감팔레트",
        "width": 214,
        "height": 190
      },
      {
        "slug": "doodle-30",
        "label": "알람시계",
        "width": 156,
        "height": 193
      }
    ]
  }
];
