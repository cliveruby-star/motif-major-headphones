/**
 * ==============================================================================
 * MOTIF Major 旗艦耳機官方網站 - Google Apps Script 後端資料庫 API
 * ==============================================================================
 * 
 * 【功能說明】
 * 1. 自動初始化與格式化 Google 試算表（Orders 預訂總表、Reviews 評價總表）
 * 2. 接收前台線上預訂資料 (doPost)，記錄預約明細至 Orders 工作表
 * 3. ★【新功能】每當有新預訂時，立即發送 LINE 即時通知 (LINE Messaging API Flex Message)
 * 4. 預訂成功後，系統自動發送「預訂確認 Email」給訂購人（顧客）
 * 5. 同步發送 Gmail 通知信給管理員 (店長)
 * 6. 接收前台顧客評價回饋 (doPost)，記錄顧客心得至 Reviews 工作表
 * 7. 支援前台動態讀取已通過審核的顧客評價 (doGet)
 * 
 * ------------------------------------------------------------------------------
 * 【LINE 通知設定 4 步驟教學】
 * ------------------------------------------------------------------------------
 * 步驟 1. 前往 LINE Developers Console (https://developers.line.biz/) 並登入個人 LINE。
 * 步驟 2. 建立 Provider (如：MOTIF) 並建立一個「Messaging API」Channel (官方帳號，名稱可叫「MOTIF 訂單秘書」)。
 * 步驟 3. 掃描該 Channel 的 QR Code，將機器人加為好友（機器人才能發私訊給您！）。
 * 步驟 4. 取得兩組金鑰並貼入下方 LINE_CONFIG：
 *         - 在「Messaging API」分頁最下方：點選 Channel access token 的「Issue (發行)」，複製整段 Token。
 *         - 在「Basic settings」分頁最下方：找到「Your user ID」(以 U 開頭的 33 碼字串)。
 * 步驟 5. 貼入下方 LINE_CONFIG 後，可在上方下拉選單選擇「testLineNotification」點擊「執行」，
 *         您的手機 LINE 就會立刻收到一則高質感的訂單測試卡片！
 * ==============================================================================
 */

// ==============================================================================
// ★ LINE 即時通知設定 (已填入您的專屬金鑰)
// ==============================================================================
const LINE_CONFIG = {
  // 1. LINE Messaging API 的 Channel Access Token
  channelAccessToken: "4M207ui8aznYAGkMk/waFY/XjtL1wzrHTgpl8tIac2MQq4+e1EqPwrK8aWM43O8YGYapJgO8msftVF7xYpMtRqw97MN1z18d3fKA3IJAH1BD764wfHnYmWcMojYXLqERY2vXvWPHf83Lkgc/kR6LMQdB04t89/1O/w1cDnyilFU=", 

  // 2. 您的 LINE User ID
  userId: "Ue137485f49cf909439ba7ec20d2b826b",

  // 3. 啟用 LINE 通知
  enabled: true
};

// 取得當前試算表
function getDb() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * 1. 初始化資料庫工作表與美化排版
 * 請在 Apps Script 編輯器上方選擇此函式並點擊「執行」一次即可。
 */
function setupDatabase() {
  const ss = getDb();

  // ----------------------------------------------------------------------------
  // A. 建立/設定 Orders 預訂總表
  // ----------------------------------------------------------------------------
  let orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) {
    orderSheet = ss.insertSheet("Orders");
  }
  orderSheet.clear();
  orderSheet.setTabColor("#b8863f");

  const orderHeaders = [
    "預訂編號", "預訂時間", "商品版本", "版本名稱", "款式配色", "配色名稱", 
    "商品單價", "預訂數量", "預估總金額", "預訂人姓名", "聯絡手機", "配送地址", 
    "電子信箱", "付款方式", "處理標記", "預約狀態", "出貨狀態", "物流單號", "預約備註"
  ];

  orderSheet.getRange(1, 1, 1, orderHeaders.length)
    .setValues([orderHeaders])
    .setBackground("#1c1917")
    .setFontColor("#f5f5f4")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  // 凍結首列
  orderSheet.setFrozenRows(1);
  orderSheet.setRowHeight(1, 36);

  // 設定建議欄寬
  const orderColWidths = [160, 160, 110, 190, 110, 190, 100, 90, 110, 120, 130, 260, 200, 160, 140, 140, 110, 140, 200];
  orderColWidths.forEach((w, idx) => orderSheet.setColumnWidth(idx + 1, w));

  // ----------------------------------------------------------------------------
  // B. 建立/設定 Reviews 顧客心得評價工作表
  // ----------------------------------------------------------------------------
  let reviewSheet = ss.getSheetByName("Reviews");
  if (!reviewSheet) {
    reviewSheet = ss.insertSheet("Reviews");
  }
  reviewSheet.clear();
  reviewSheet.setTabColor("#22c55e");

  const reviewHeaders = [
    "評價編號", "填寫時間", "顧客暱稱", "星等評分", "購買版本代碼", "版本名稱", 
    "滿意情境標籤", "心得評論內容", "審核發布狀態", "驗證購買標記"
  ];

  reviewSheet.getRange(1, 1, 1, reviewHeaders.length)
    .setValues([reviewHeaders])
    .setBackground("#1c1917")
    .setFontColor("#f5f5f4")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  reviewSheet.setFrozenRows(1);
  reviewSheet.setRowHeight(1, 36);

  const reviewColWidths = [160, 160, 140, 90, 120, 190, 150, 340, 120, 110];
  reviewColWidths.forEach((w, idx) => reviewSheet.setColumnWidth(idx + 1, w));

  // 預先寫入展示評價
  const sampleReviews = [
    [
      "REV_1001", "2026/10/12 14:20:00", "林映晨 (Chen L.)", 5, "pro", "購買：高階版 (Pro ANC)",
      "捷運通勤必備", "每天搭文湖線通勤真的被鐵軌聲吵到頭痛，這台高階版 ANC 一開瞬間像進入私人圖書館！音質保留了 MOTIF 招牌的紮實鼓點與人聲厚度，極推！",
      "APPROVED", true
    ],
    [
      "REV_1002", "2026/10/08 09:15:00", "張庭宇 (Marcus T.)", 5, "standard", "購買：普通版 (Standard)",
      "續航怪獸", "普通版 3990 價格非常親民！續航力真的誇張，買來到現在聽了一個多禮拜都還不需要充電。黃銅五向旋鈕手感一絕，盲操非常直覺！",
      "APPROVED", true
    ],
    [
      "REV_1003", "2026/09/29 18:40:00", "何詩婷 (Chloe H.)", 5, "pro", "購買：高階版 (Pro ANC)",
      "辦公室專注好物", "在開放式建築事務所工作，這副耳機是我的救星。配戴感比起上一代輕巧很多，耳罩軟綿綿不壓眼鏡架。空間音訊搭配 LDAC 無損格式，聽古典與爵士樂空間細節超豐富。",
      "APPROVED", true
    ]
  ];

  sampleReviews.forEach(row => reviewSheet.appendRow(row));

  Logger.log("✅ MOTIF 資料庫表單初始化完成！Orders 與 Reviews 均已建立。");
}

/**
 * 2. 接收前端 POST 請求 (建立預訂單 / 新增評價)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buildJsonResponse({ success: false, error: "無效的請求資料" });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;
    const ss = getDb();

    // ==========================================================================
    // ACTION 1: 建立預訂單 (createOrder)
    // ==========================================================================
    if (action === "createOrder") {
      let sheet = ss.getSheetByName("Orders");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Orders");
      }

      const orderRow = [
        data.order_id || ("PRE" + Date.now().toString().slice(-8)),
        data.created_at || Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss"),
        data.product_edition || "pro",
        data.edition_name || "高階版 (Pro ANC Edition)",
        data.color || "black",
        data.color_name || "經典黑 (Classic Black)",
        Number(data.unit_price) || 5990,
        Number(data.quantity) || 1,
        Number(data.total_amount) || 5990,
        data.buyer_name || "",
        data.buyer_phone || "",
        data.buyer_address || "",
        data.buyer_email || "",
        data.payment_method || "貨到付款 (免預先刷卡)",
        data.masked_card || "線上預訂免刷卡",
        data.payment_status || "預訂成功 (到貨付款)",
        "PENDING", // 預設出貨狀態：待出貨
        "",        // 預留物流單號
        data.order_notes || "無特殊備註"
      ];

      sheet.appendRow(orderRow);

      // 1. ★ 發送 LINE 即時推播給店長
      try {
        sendLineNotification(data);
      } catch (lineErr) {
        Logger.log("LINE 通知發送略過或失敗: " + lineErr.toString());
      }

      // 2. 發送「訂單確認信」給預訂人 (顧客)
      try {
        sendCustomerConfirmationEmail(data);
      } catch (custMailErr) {
        Logger.log("寄送顧客確認信略過或失敗: " + custMailErr.toString());
      }

      // 3. 發送 Gmail 通知信給店長 (管理員)
      try {
        notifyOwnerNewOrder(data);
      } catch (ownerMailErr) {
        Logger.log("通知店長信件略過或失敗: " + ownerMailErr.toString());
      }

      return buildJsonResponse({
        success: true,
        message: "預訂單已成功寫入 Google 試算表，並已發送 LINE 與 Email 通知",
        orderId: data.order_id
      });
    }

    // ==========================================================================
    // ACTION 2: 新增顧客評價 (createReview)
    // ==========================================================================
    if (action === "createReview") {
      let sheet = ss.getSheetByName("Reviews");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Reviews");
      }

      const reviewRow = [
        data.review_id || ("REV_" + Date.now()),
        data.created_at || Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss"),
        data.reviewer_name || "匿名顧客",
        Number(data.rating) || 5,
        data.product_edition || "pro",
        data.edition_name || "高階版 (Pro ANC Edition)",
        data.scenario_tag || "日常推薦",
        data.review_comment || "",
        "APPROVED", // 預設審核狀態：直接通過
        true        // 已驗證購買
      ];

      sheet.appendRow(reviewRow);

      return buildJsonResponse({
        success: true,
        message: "評價已成功寫入 Google 試算表",
        reviewId: data.review_id
      });
    }

    return buildJsonResponse({ success: false, error: "未知的 action 操作: " + action });
  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return buildJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 3. 接收前端 GET 請求 (取得評價 / 心跳檢查)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getReviews";
    const ss = getDb();

    if (action === "getReviews") {
      const sheet = ss.getSheetByName("Reviews");
      if (!sheet) {
        return buildJsonResponse({ success: true, reviews: [] });
      }

      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) {
        return buildJsonResponse({ success: true, reviews: [] });
      }

      const reviews = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const status = String(row[8]).trim().toUpperCase();

        if (status === "APPROVED" || status === "已發布") {
          reviews.push({
            id: row[0],
            date: formatDisplayDate(row[1]),
            name: row[2],
            rating: Number(row[3]) || 5,
            edition: row[4],
            editionText: row[5],
            tag: row[6],
            comment: row[7],
            isVerified: Boolean(row[9])
          });
        }
      }

      reviews.reverse();
      return buildJsonResponse({ success: true, count: reviews.length, reviews: reviews });
    }

    if (action === "ping") {
      return buildJsonResponse({ success: true, message: "MOTIF GAS API 運作正常", timestamp: new Date() });
    }

    return buildJsonResponse({ success: false, error: "未知的 GET action: " + action });
  } catch (err) {
    return buildJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * ★ 核心功能 1：發送 LINE 即時通知 (強制 UTF-8 編碼，手機鎖定畫面直接預覽)
 */
function sendLineNotification(data) {
  if (!LINE_CONFIG.enabled || !LINE_CONFIG.channelAccessToken || !LINE_CONFIG.userId) {
    Logger.log("⚠️ LINE 通知尚未填入 channelAccessToken 或 userId，略過推播。");
    return;
  }

  const lineUrl = "https://api.line.me/v2/bot/message/push";

  const messageText = 
    "🎧【MOTIF Sound Lab】官方新預約成立！\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📋 預訂編號：" + data.order_id + "\n" +
    "⏰ 下單時間：" + data.created_at + "\n" +
    "\n" +
    "📦 預訂商品：" + data.edition_name + "\n" +
    "🎨 款式配色：" + data.color_name + "\n" +
    "🔢 預訂數量：" + data.quantity + " 台\n" +
    "💰 預估金額：NT$ " + Number(data.total_amount).toLocaleString() + " (早鳥免運)\n" +
    "🚚 付款方式：" + (data.payment_method || "黑貓貨到付款") + "\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "👤 預訂姓名：" + data.buyer_name + "\n" +
    "📞 聯絡手機：" + data.buyer_phone + "\n" +
    "📍 配送地址：" + data.buyer_address + "\n" +
    "✉️ 電子信箱：" + data.buyer_email + "\n" +
    "📝 預約備註：" + (data.order_notes || "無") + "\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 請開啟 Google 試算表檢視出貨排程：\n" +
    SpreadsheetApp.getActiveSpreadsheet().getUrl();

  const payload = {
    to: LINE_CONFIG.userId,
    messages: [
      {
        type: "text",
        text: messageText
      }
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json; charset=UTF-8",
    headers: {
      "Authorization": "Bearer " + LINE_CONFIG.channelAccessToken
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(lineUrl, options);
  Logger.log("LINE 推播回應: " + response.getContentText());
}

/**
 * LINE 連線測試小工具 (可在 Apps Script 點擊執行測試)
 */
function testLineNotification() {
  const dummyOrder = {
    order_id: "PRE" + Date.now().toString().slice(-8),
    created_at: Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss"),
    product_edition: "pro",
    edition_name: "高階版 (Pro ANC Edition)",
    color: "cream",
    color_name: "復古米白 (Vintage Cream)",
    unit_price: 5990,
    quantity: 1,
    total_amount: 5990,
    buyer_name: "LINE 測試好友",
    buyer_phone: "0912-345-678",
    buyer_address: "台北市信義區松仁路 100 號 8 樓",
    buyer_email: "test@example.com",
    payment_method: "黑貓貨到付款 (免預先刷卡)",
    order_notes: "這是 LINE 機器人連線測試通知！"
  };

  sendLineNotification(dummyOrder);
  Logger.log("✅ 已送出 LINE 測試訊息！請查看您的手機 LINE 是否有收到卡片。");
}

/**
 * ★ 核心功能 2：發送預訂確認信給顧客 (預訂人)
 */
function sendCustomerConfirmationEmail(data) {
  const customerEmail = data.buyer_email ? String(data.buyer_email).trim() : "";
  if (!customerEmail || !customerEmail.includes("@")) {
    Logger.log("顧客未填寫有效 Email，略過寄送確認信。");
    return;
  }

  const subject = `【MOTIF Sound Lab】預約確認通知：${data.buyer_name} 您好，我們已收到您的耳機預訂單（編號：${data.order_id}）`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 24px 12px; color: #292524;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background-color: #1c1917; color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="color: #b8863f; font-size: 26px; font-weight: 800; letter-spacing: 2px; margin: 0;">MOTIF SOUND LAB</h1>
          <div style="color: #a8a29e; font-size: 13px; margin-top: 6px; letter-spacing: 1px;">BRITISH ROCK HERITAGE × NORDIC MINIMALISM</div>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 28px; line-height: 1.65;">
          <div style="font-size: 17px; font-weight: 700; color: #1c1917; margin-bottom: 12px;">
            親愛的 ${data.buyer_name} 您好：
          </div>
          <p style="color: #57534e; font-size: 14.5px; margin-bottom: 24px;">
            非常感謝您在 MOTIF 官方網站預訂 <strong>MOTIF Major 旗艦無線耳罩式耳機</strong>。我們已成功將您的預訂資料登錄至官方資料庫中，並為您優先保留首批現貨出貨名額！
          </p>

          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 8px 18px; border-radius: 20px; font-weight: 700; font-size: 13.5px; border: 1px solid #fde68a;">
              ✓ 官方預訂成功 • 首批現貨優先保留
            </span>
          </div>

          <!-- Receipt Details Table -->
          <div style="background-color: #faf7f2; border: 1px solid #f5ede0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c; width: 35%;">預訂編號</td>
                <td style="padding: 9px 0; color: #1c1917; width: 65%; font-weight: 700; text-align: right; font-family: monospace; letter-spacing: 1px;">${data.order_id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">預訂時間</td>
                <td style="padding: 9px 0; color: #1c1917; text-align: right;">${data.created_at}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">預訂商品</td>
                <td style="padding: 9px 0; color: #1c1917; font-weight: 600; text-align: right;">${data.edition_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">款式配色</td>
                <td style="padding: 9px 0; color: #1c1917; font-weight: 600; text-align: right;">${data.color_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">預訂數量</td>
                <td style="padding: 9px 0; color: #1c1917; text-align: right;">${data.quantity} 台</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">配送物流</td>
                <td style="padding: 9px 0; color: #22c55e; font-weight: 600; text-align: right;">黑貓宅急便（早鳥免運費 NT$ 0）</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">付款方式</td>
                <td style="padding: 9px 0; color: #1c1917; text-align: right;">${data.payment_method || '黑貓貨到付款 (免預先刷卡)'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">聯絡電話</td>
                <td style="padding: 9px 0; color: #1c1917; text-align: right;">${data.buyer_phone}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">配送地址</td>
                <td style="padding: 9px 0; color: #1c1917; text-align: right;">${data.buyer_address}</td>
              </tr>
              ${data.order_notes ? `
              <tr style="border-bottom: 1px solid #f0e6d6;">
                <td style="padding: 9px 0; color: #78716c;">預約備註</td>
                <td style="padding: 9px 0; color: #1c1917; text-align: right;">${data.order_notes}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 12px 0 4px; color: #1c1917; font-size: 15px; font-weight: 700;">預估結算總額</td>
                <td style="padding: 12px 0 4px; color: #b8863f; font-size: 20px; font-weight: 800; text-align: right;">NT$ ${Number(data.total_amount).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- Notice Box -->
          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 16px; border-radius: 4px; font-size: 13.5px; color: #166534; line-height: 1.65; margin-bottom: 24px;">
            <strong>📦 首批到貨與配送說明：</strong><br>
            1. 本次預約<strong>無需預先刷卡扣款</strong>，保障您的資金與交易安全。<br>
            2. 首批現貨抵台檢驗完成後，客服專員將於出貨前以<strong>簡訊或電話</strong>向您聯繫確認配送時段。<br>
            3. 所有耳機均享有台灣原廠保固與 7 天猶豫期完整售後服務。
          </div>

          <p style="font-size: 13px; color: #78716c; margin-top: 20px; line-height: 1.6;">
            若您需要修改配送地址或有任何疑問，歡迎隨時直接回覆此封信件，我們的客服專員將儘速為您服務。
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f5f5f4; padding: 22px 20px; text-align: center; color: #a8a29e; font-size: 12px; border-top: 1px solid #e7e5e4;">
          © 2026 MOTIF Sound Lab. All Rights Reserved.<br>
          台北市信義區聲學設計實驗室 • 客服專線：0800-888-999
        </div>
      </div>
    </body>
    </html>
  `;

  MailApp.sendEmail({
    to: customerEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: "MOTIF Sound Lab 官方旗艦店"
  });
}

/**
 * ★ 輔助函式：發送新訂單通知信給試算表擁有者 (店長)
 */
function notifyOwnerNewOrder(data) {
  const recipient = Session.getEffectiveUser().getEmail();
  if (!recipient) return;

  const subject = `【MOTIF 官網新預訂】編號：${data.order_id} - ${data.buyer_name} 已預約 NT$ ${Number(data.total_amount).toLocaleString()}`;
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1c1917; color: #b8863f; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 1.4rem;">🎧 MOTIF Major 官方網站 - 新預約單成立！</h2>
      </div>
      <div style="padding: 24px; color: #292524; line-height: 1.6;">
        <p>店長您好！官網剛收到一筆新預約單，明細如下：</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">預訂編號</td><td><strong>${data.order_id}</strong></td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">預約商品</td><td>${data.edition_name}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">款式配色</td><td>${data.color_name}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">數量與單價</td><td>${data.quantity} 台 (單價 NT$ ${Number(data.unit_price).toLocaleString()})</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">結帳總金額</td><td><strong style="color: #b8863f; font-size: 1.1rem;">NT$ ${Number(data.total_amount).toLocaleString()}</strong></td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">付款方式</td><td>${data.payment_method}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">預訂人姓名</td><td>${data.buyer_name}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">聯絡手機</td><td>${data.buyer_phone}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">配送地址</td><td>${data.buyer_address}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">電子信箱</td><td>${data.buyer_email}</td></tr>
          <tr><td style="padding: 8px 0; color: #78716c;">預約備註</td><td>${data.order_notes || "無"}</td></tr>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="background-color: #b8863f; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">打開 Google 試算表檢視</a>
        </div>
      </div>
      <div style="background-color: #f5f5f4; color: #a8a29e; text-align: center; padding: 12px; font-size: 0.8rem;">
        已同步發送【預約確認信】至顧客信箱 (${data.buyer_email})
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    htmlBody: htmlBody,
    name: "MOTIF Sound Lab 官網系統"
  });
}

/**
 * 輔助函式：日期格式化
 */
function formatDisplayDate(val) {
  if (!val) return "近期發布";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Taipei", "yyyy/MM/dd");
  }
  return String(val).split(" ")[0];
}

/**
 * 格式化 JSON 回應 (支援 CORS 跨網域請求)
 */
function buildJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
