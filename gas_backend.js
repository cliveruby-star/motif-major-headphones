/**
 * ==============================================================================
 * MOTIF Major 旗艦耳機官方網站 - Google Apps Script 後端資料庫 API
 * ==============================================================================
 * 
 * 【功能說明】
 * 1. 自動初始化與格式化 Google 試算表（Orders 訂單總表、Reviews 評價總表）
 * 2. 接收前台購物車結帳資料 (doPost)，記錄訂單明細至 Orders 工作表
 * 3. 接收前台顧客評價回饋 (doPost)，記錄顧客心得至 Reviews 工作表
 * 4. 支援前台動態讀取已通過審核的顧客評價 (doGet)
 * 5. 訂單成立時自動發送 Gmail 通知信給管理者信箱 (通知有新訂單進來)
 * 
 * ------------------------------------------------------------------------------
 * 【如何使用本檔案？ 快速 5 步驟教學】
 * ------------------------------------------------------------------------------
 * 步驟 1. 開啟您的 Google 雲端硬碟，新增一個「Google 試算表」(例如命名為：MOTIF 耳機官方資料庫)。
 * 步驟 2. 在試算表上方選單點選【擴充功能】 > 【Apps Script】。
 * 步驟 3. 清空 Apps Script 編輯器內原本的所有文字，將本檔案「全選 (Ctrl+A) > 複製 > 貼上 (Ctrl+V)」。
 * 步驟 4. 首次執行初始化：
 *         - 在上方工具列的函式下拉選單中選擇「setupDatabase」。
 *         - 點擊「執行 (Run)」，此時 Google 會提示授權，依序點擊「審查權限」> 選擇您的 Google 帳號 > 
 *           「進階 (Advanced)」 >「前往 (不安全)」>「允許」。
 *         - 執行完成後，返回試算表即可看見【Orders】與【Reviews】兩個設計精美的工作表標題。
 * 步驟 5. 發布為 Web 應用程式 (Web App)：
 *         - 點選右上角藍色的【部署 (Deploy)】 > 【新增部署 (New deployment)】。
 *         - 點擊齒輪圖示，選擇【網頁應用程式 (Web app)】。
 *         - 說明：輸入「v1 正式上線」。
 *         - 執行身分：選擇「我 (您的 Email)」。
 *         - 誰可以存取：務必選擇【任何人 (Anyone)】（重要！否則訪客瀏覽器無法寫入）。
 *         - 點擊「部署」，複製產生的【網頁應用程式網址】(結尾為 /exec)。
 * 步驟 6. 將複製的網址貼到前端 app.js 中的 GAS_CONFIG.apiUrl 即可完成對接！
 * ==============================================================================
 */

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
  // A. 建立/設定 Orders 訂單工作表
  // ----------------------------------------------------------------------------
  let orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) {
    orderSheet = ss.insertSheet("Orders");
  }
  orderSheet.clear();
  orderSheet.setTabColor("#b8863f");

  const orderHeaders = [
    "訂單編號", "下單時間", "商品版本", "版本名稱", "款式配色", "配色名稱", 
    "商品單價", "訂購數量", "訂單總金額", "收件人姓名", "聯絡手機", "收件地址", 
    "電子信箱", "付款管道", "卡號遮罩/交易序號", "付款狀態", "出貨狀態", "物流單號", "訂單備註"
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
  const orderColWidths = [160, 160, 110, 190, 110, 190, 100, 90, 110, 120, 130, 260, 200, 130, 180, 110, 110, 140, 180];
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

  // 預先寫入幾筆展示評價 (避免資料庫初次為空)
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
 * 2. 接收前端 POST 請求 (建立訂單 / 新增評價)
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
    // ACTION 1: 建立訂單 (createOrder)
    // ==========================================================================
    if (action === "createOrder") {
      let sheet = ss.getSheetByName("Orders");
      if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName("Orders");
      }

      const orderRow = [
        data.order_id || ("EC" + Date.now().toString().slice(-8)),
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
        data.payment_method || "credit_card",
        data.masked_card || "N/A",
        data.payment_status || "PAID",
        "PENDING", // 預設出貨狀態：待出貨
        "",        // 預留物流單號
        data.order_notes || ""
      ];

      sheet.appendRow(orderRow);

      // 非同步發送通知信給管理員 (可選功能)
      try {
        notifyOwnerNewOrder(data);
      } catch (mailErr) {
        Logger.log("通知信發送略過或失敗: " + mailErr.toString());
      }

      return buildJsonResponse({
        success: true,
        message: "訂單已成功寫入 Google 試算表",
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
        "APPROVED", // 預設審核狀態：直接通過 (若想人工審核可改為 PENDING)
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

    // ==========================================================================
    // ACTION: 取得審核通過的心得評價 (getReviews)
    // ==========================================================================
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
      // 從第二列開始讀取資料 (略過第 1 列標題)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const status = String(row[8]).trim().toUpperCase();

        // 僅輸出審核通過 (APPROVED) 的評價
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

      // 依照時間降冪排列 (最新的在最前面)
      reviews.reverse();

      return buildJsonResponse({ success: true, count: reviews.length, reviews: reviews });
    }

    // 系統健康檢查
    if (action === "ping") {
      return buildJsonResponse({ success: true, message: "MOTIF GAS API 運作正常", timestamp: new Date() });
    }

    return buildJsonResponse({ success: false, error: "未知的 GET action: " + action });
  } catch (err) {
    return buildJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 輔助函式：發送新訂單通知信給試算表擁有者
 */
function notifyOwnerNewOrder(data) {
  const recipient = Session.getEffectiveUser().getEmail();
  if (!recipient) return;

  const subject = `【MOTIF 官網新訂單通知】編號：${data.order_id} - ${data.buyer_name} 同學已下單 NT$ ${Number(data.total_amount).toLocaleString()}`;
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1c1917; color: #b8863f; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 1.4rem;">🎧 MOTIF Major 官方網站 - 新訂單成立！</h2>
      </div>
      <div style="padding: 24px; color: #292524; line-height: 1.6;">
        <p>您好！官網剛收到一筆新耳機訂購單，明細如下：</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">訂單編號</td><td><strong>${data.order_id}</strong></td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">訂購商品</td><td>${data.edition_name}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">款式配色</td><td>${data.color_name}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">數量與單價</td><td>${data.quantity} 台 (單價 NT$ ${Number(data.unit_price).toLocaleString()})</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">結帳總金額</td><td><strong style="color: #b8863f; font-size: 1.1rem;">NT$ ${Number(data.total_amount).toLocaleString()}</strong></td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">付款方式</td><td>${data.payment_method === 'credit_card' ? '信用卡在線刷卡' : '綠界科技 ECPay'}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">收件人姓名</td><td>${data.buyer_name}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">收件手機</td><td>${data.buyer_phone}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px 0; color: #78716c;">寄送地址</td><td>${data.buyer_address}</td></tr>
          <tr><td style="padding: 8px 0; color: #78716c;">收件信箱</td><td>${data.buyer_email}</td></tr>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="background-color: #b8863f; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">打開 Google 試算表檢視</a>
        </div>
      </div>
      <div style="background-color: #f5f5f4; color: #a8a29e; text-align: center; padding: 12px; font-size: 0.8rem;">
        此信件由 MOTIF 官網 Google Apps Script 自動寄出
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    htmlBody: htmlBody
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
