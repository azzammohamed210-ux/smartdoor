export type Lang = "ar" | "en";

export interface Strings {
  appTitle: string;
  appSubtitle: string;
  dashboard: string;
  workOrders: string;
  inventory: string;
  management: string;
  techMap: string;
  adminMap: string;
  login: string;
  logout: string;
  email: string;
  password: string;
  signIn: string;
  loginError: string;
  accountDeactivated: string;
  welcome: string;
  roleAdmin: string;
  roleTechnician: string;
  totalRevenue: string;
  warrantyNote: string;
  warrantyTerms: string;
  totalWorkOrders: string;
  activeTechnicians: string;
  lowStockAlerts: string;
  revenueBreakdown: string;
  orderStatusDistribution: string;
  cash: string;
  bankTransfer: string;
  pending: string;
  inProgress: string;
  completed: string;
  cancelled: string;
  newOrder: string;
  searchOrders: string;
  filterAll: string;
  assignTechnician: string;
  selectTechnician: string;
  clientName: string;
  clientPhone: string;
  clientLocation: string;
  gpsLink: string;
  gpsAutoDetect: string;
  openGoogleMaps: string;
  product: string;
  selectProduct: string;
  amountOmr: string;
  warranty: string;
  warrantyNone: string;
  warranty1y: string;
  warranty2y: string;
  warranty3y: string;
  paymentMethod: string;
  installationChecklist: string;
  maintenanceChecklist: string;
  notes: string;
  maintenanceNotes: string;
  save: string;
  cancel: string;
  create: string;
  startWork: string;
  completeOrder: string;
  orderCompletedSuccess: string;
  cancelOrder: string;
  cancelReason: string;
  cancelReasonPlaceholder: string;
  call: string;
  whatsapp: string;
  map: string;
  noLocationLink: string;
  orderNumber: string;
  status: string;
  technician: string;
  actions: string;
  noOrders: string;
  routeLabel: string;
  manageTechnicians: string;
  addTechnician: string;
  technicianName: string;
  deleteTechnician: string;
  confirmDelete: string;
  manageProducts: string;
  searchProducts: string;
  categoryAll: string;
  categoryLock: string;
  categoryDoor: string;
  productCode: string;
  productName: string;
  productCategory: string;
  productPrice: string;
  totalStock: string;
  reorderLevel: string;
  availableStock: string;
  addProduct: string;
  editProduct: string;
  deleteProduct: string;
  inStock: string;
  lowStock: string;
  outStock: string;
  receiptAttached: string;
  finalPhotoAttached: string;
  idImageAttached: string;
  uploadReceipt: string;
  uploadFinalPhoto: string;
  uploadIdImage: string;
  invoice: string;
  invoiceId: string;
  invoiceDate: string;
  downloadInvoice: string;
  invoicePreviewTitle: string;
  sendToCustomer: string;
  workOrderMap: string;
  techOrdersMap: string;
  back: string;
  selectTechnicianMap: string;
  legendCompleted: string;
  legendCancelled: string;
  legendPending: string;
  legendInProgress: string;
  bulkImport: string;
  bulkImportTitle: string;
  bulkImportPlaceholder: string;
  bulkImportParse: string;
  bulkImportDispatch: string;
  bulkImportPreview: string;
  bulkImportSuccess: string;
  bulkImportParsing: string;
  bulkImportDispatching: string;
  pastePhone: string;
  addNewOrderCard: string;
  analyzeCard: string;
  cardRawPlaceholder: string;
  cardAnalyzed: string;
  cardPending: string;
  noCards: string;
  selectTechniciansTitle: string;
  selectTechniciansHint: string;
  noActiveTechs: string;
  confirmDispatch: string;
  cardPhone: string;
  cardProduct: string;
  cardTime: string;
  cardLocation: string;
  deleteCard: string;
  editCard: string;
  cardsCount: string;
  draftSaved: string;
  aiAnalyzing: string;
  aiSource: string;
  fallbackSource: string;
  colName: string;
  colPhone: string;
  colLocation: string;
  colProduct: string;
  colTime: string;
  colTech: string;
  colRoute: string;
  missingPhone: string;
  noParsedOrders: string;
  whatsappMessage: (o: { order_number: string; client_name?: string }) => string;
  customerDatabase: string;
  customerDatabaseTitle: string;
  searchCustomers: string;
  archivedOrders: string;
  noArchivedOrders: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDate: string;
  sortName: string;
  sortAmount: string;
  totalAmount: string;
  archivedOn: string;
  orderDetails: string;
  customerProfile: string;
  workOrderInfo: string;
  viewInvoice: string;
  printInvoice: string;
  sendWhatsapp: string;
  archiveRunning: string;
  archiveDone: string;
  recordsCount: string;
  completedOrders: string;
  selectOrders: string;
  archiveSelected: string;
  archiveSelectedConfirm: string;
  updateAvailable: string;
  updateNow: string;
  updateDesc: string;
  clusters: string;
  clusterGroup: string;
  ordersInCluster: string;
  zoomInCluster: string;
  satelliteView: string;
  defaultView: string;
  visitOrder: string;
  route: string;
  routeColors: string;
  tapClusterHint: string;
  deleteOrder: string;
  confirmDeleteOrder: string;
  bulkDeleteSelected: string;
  bulkDeleteConfirm: string;
  selectAll: string;
  deselectAll: string;
  selectedCount: string;
  longPressHint: string;
  deletePermanently: string;
  managerEditOrder: string;
  saveChanges: string;
  editOrderFields: string;
  changesSaved: string;
  longPressEditHint: string;
  viewCustomersMap: string;
  inventoryConsumptionReport: string;
  consumptionReportTitle: string;
  consumptionDate: string;
  consumptionFullReport: string;
  consumptionToday: string;
  consumptionNoData: string;
  consumptionTotalInstallations: string;
  consumptionQuantity: string;
  consumptionProduct: string;
  consumptionTechnician: string;
  consumptionAutoPriced: string;
  cashCollection: string;
  cashCollected: string;
  cashCollectAmount: string;
  cashTotalForDay: string;
  cashTotalAllTime: string;
  consumptionGrandTotal: string;
  scanIdOcr: string;
  ocrScanning: string;
  ocrConfirmTitle: string;
  ocrConfirmName: string;
  ocrNoName: string;
  ocrConfirm: string;
  ocrRetake: string;
  invoiceProduct: string;
  invoiceQty: string;
  invoiceUnitPrice: string;
  invoiceLineTotal: string;
  invoiceGrandTotal: string;
  invoiceAmountPaid: string;
  invoiceRemaining: string;
  toastOrderCreated: string;
  toastOrderCancelled: string;
  toastOrderCompleted: string;
  toastCashCollected: string;
}

export const translations: Record<Lang, Strings> = {
  ar: {
    appTitle: "MZ SMART",
    appSubtitle: "أنظمة الأبواب الأوتوماتيكية والأقفال الذكية",
    dashboard: "لوحة التحكم",
    workOrders: "أوامر العمل",
    inventory: "المخزون",
    management: "الإدارة",
    techMap: "خريطة الأوامر",
    adminMap: "خرائط الفنيين",
    login: "تسجيل الدخول",
    logout: "خروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "دخول",
    loginError: "بيانات الدخول غير صحيحة",
    accountDeactivated: "تم إلغاء تفعيل حسابك من قبل الإدارة",
    welcome: "مرحباً",
    roleAdmin: "مدير",
    roleTechnician: "فني",
    totalRevenue: "المبلغ المدفوع",
    warrantyTerms: "شروط وإرشادات الضمان",
    warrantyNote: "1. نطاق التغطية: يغطي الضمان العيوب التصنيعية للأجهزة والأعطال الفنية الناتجة عن عملية التركيب فقط.\n2. العوامل الجوية: لا يشمل الضمان الأعطال أو الأضرار الناتجة عن سوء الأحوال والعوامل الجوية.\n3. التيار الكهربائي: لا يشمل الضمان الأعطال الناتجة عن تذبذب أو ارتفاع وانخفاض التيار الكهربائي في الموقع.",
    totalWorkOrders: "إجمالي أوامر العمل",
    activeTechnicians: "الفنيين النشطين",
    lowStockAlerts: "تنبيهات نقص المخزون",
    revenueBreakdown: "تفصيل الإيرادات (ر.ع)",
    orderStatusDistribution: "توزيع حالات أوامر العمل",
    cash: "نقدي",
    bankTransfer: "تحويل بنكي",
    pending: "قيد الانتظار",
    inProgress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي",
    newOrder: "أمر عمل جديد",
    searchOrders: "البحث عن الأوامر، العملاء، الفنيين...",
    filterAll: "الكل",
    assignTechnician: "الفني المسؤول",
    selectTechnician: "اختر الفني",
    clientName: "اسم العميل",
    clientPhone: "رقم هاتف العميل",
    clientLocation: "موقع العميل",
    gpsLink: "رابط موقع العميل أو الإحداثيات (GPS)",
    gpsAutoDetect: "تحديد تلقائي",
    openGoogleMaps: "فتح خرائط جوجل",
    product: "المنتج",
    selectProduct: "اختر المنتج",
    amountOmr: "المبلغ (ر.ع)",
    warranty: "فترة الضمان",
    warrantyNone: "بدون ضمان",
    warranty1y: "سنة",
    warranty2y: "سنتين",
    warranty3y: "ثلاث سنوات",
    paymentMethod: "طريقة الدفع",
    installationChecklist: "قائمة فحص الصيانة والتركيب",
    maintenanceChecklist: "قائمة فحص الصيانة والتركيب",
    notes: "ملاحظات",
    maintenanceNotes: "ملاحظات الصيانة والتركيب",
    save: "حفظ",
    cancel: "إلغاء",
    create: "إنشاء",
    startWork: "بدء العمل",
    completeOrder: "إكتمال الأمر",
    orderCompletedSuccess: "تم حفظ البيانات وإكتمال الأمر بنجاح",
    cancelOrder: "إلغاء الأمر",
    cancelReason: "يرجى كتابة سبب الإلغاء (إجباري)",
    cancelReasonPlaceholder: "اكتب سبب الإلغاء هنا...",
    call: "اتصال",
    whatsapp: "واتساب",
    map: "الخريطة",
    noLocationLink: "لا يوجد رابط موقع لهذا الطلب",
    orderNumber: "رقم الأمر",
    status: "الحالة",
    technician: "الفني",
    actions: "إجراءات",
    noOrders: "لا توجد أوامر عمل",
    routeLabel: "مسار",
    manageTechnicians: "إدارة الفنيين",
    addTechnician: "إضافة فني",
    technicianName: "اسم الفني",
    deleteTechnician: "حذف الفني",
    confirmDelete: "هل أنت متأكد من الحذف؟",
    manageProducts: "إدارة المنتجات والمخزون",
    searchProducts: "البحث عن المنتجات أو الفئات...",
    categoryAll: "الكل",
    categoryLock: "أقفال ذكية",
    categoryDoor: "أبواب أوتوماتيكية",
    productCode: "كود المنتج",
    productName: "اسم المنتج",
    productCategory: "الفئة",
    productPrice: "السعر (ر.ع)",
    totalStock: "إجمالي المخزون",
    reorderLevel: "حد التنبيه",
    availableStock: "المخزون المتوفر",
    addProduct: "إضافة منتج",
    editProduct: "تعديل المنتج",
    deleteProduct: "حذف المنتج",
    inStock: "متوفر",
    lowStock: "مخزون منخفض",
    outStock: "غير متوفر",
    receiptAttached: "تم إرفاق إيصال التحويل البنكي",
    finalPhotoAttached: "تم إرفاق صورة إنجاز التركيب",
    idImageAttached: "تم إرفاق هوية العميل",
    uploadReceipt: "رفع إيصال التحويل",
    uploadFinalPhoto: "رفع صورة إنجاز التركيب",
    uploadIdImage: "إرفاق هوية العميل (صورة فقط)",
    invoice: "فاتورة",
    invoiceId: "رقم الفاتورة",
    invoiceDate: "التاريخ",
    downloadInvoice: "تحميل الفاتورة",
    invoicePreviewTitle: "معاينة الفاتورة الإلكترونية",
    sendToCustomer: "إرسال الفاتورة للعميل",
    workOrderMap: "خريطة أوامر العمل",
    techOrdersMap: "خرائط أوردرات الفنيين",
    back: "رجوع",
    selectTechnicianMap: "اختر فني لعرض الخريطة",
    legendCompleted: "مكتمل",
    legendCancelled: "ملغي",
    legendPending: "قيد الانتظار",
    legendInProgress: "قيد التنفيذ",
    bulkImport: "استيراد وتوزيع الطلبات تلقائياً",
    bulkImportTitle: "استيراد وتوزيع الطلبات تلقائياً",
    bulkImportPlaceholder: "الصق هنا محادثات واتساب الخام... (أسماء العملاء، أرقام الهواتف، روابط خرائط جوجل، تفاصيل المنتج، الأوقات المفضلة)",
    bulkImportParse: "تحليل النص",
    bulkImportDispatch: "توزيع وإنشاء الطلبات",
    bulkImportPreview: "معاينة الطلبات المستخرجة",
    bulkImportSuccess: "تم إنشاء الطلبات بنجاح",
    bulkImportParsing: "جاري التحليل...",
    bulkImportDispatching: "جاري التوزيع والإنشاء...",
    pastePhone: "لصق الهاتف",
    addNewOrderCard: "+ إضافة أمر عمل جديد",
    analyzeCard: "تحليل",
    cardRawPlaceholder: "الصق نص العميل هنا... (الاسم، الهاتف، رابط الخريطة، المنتج، الوقت)",
    cardAnalyzed: "تم التحليل",
    cardPending: "بانتظار التحليل",
    noCards: "لا توجد بطاقات بعد. اضغط \"إضافة أمر عمل جديد\" للبدء.",
    selectTechniciansTitle: "اختيار الفنيين للتوزيع",
    selectTechniciansHint: "حدد الفنيين (يمكن اختيار 1 أو 2 أو 3)",
    noActiveTechs: "لا يوجد فنيون نشطون. أضف فنيين أولاً.",
    confirmDispatch: "توزيع وإنشاء الطلبات",
    cardPhone: "الهاتف",
    cardProduct: "المنتج",
    cardTime: "الوقت",
    cardLocation: "الموقع",
    deleteCard: "حذف",
    editCard: "تعديل",
    cardsCount: "بطاقات",
    draftSaved: "تم الحفظ تلقائياً",
    aiAnalyzing: "جاري التحليل بالذكاء الاصطناعي...",
    aiSource: "تحليل ذكي",
    fallbackSource: "تحليل محلي",
    colName: "الاسم",
    colPhone: "الهاتف",
    colLocation: "الموقع",
    colProduct: "المنتج",
    colTime: "الوقت",
    colTech: "الفني",
    colRoute: "المسار",
    missingPhone: "رقم الهاتف مفقود",
    noParsedOrders: "لم يتم العثور على طلبات. الصق النص وحاول مرة أخرى.",
    whatsappMessage: (o) =>
      `مرحباً ${o.client_name || ""}\nتم انجاز التركيب بنجاح برقم\n${o.order_number}\nشكرا لثقتكم بنا.`,
    customerDatabase: "🗄️ قاعدة بيانات العملاء",
    customerDatabaseTitle: "قاعدة بيانات العملاء",
    searchCustomers: "بحث: اسم العميل، الهاتف، الفني...",
    archivedOrders: "الأوامر المؤرشفة",
    noArchivedOrders: "لا توجد سجلات عملاء مؤرشفة",
    dateFrom: "من تاريخ",
    dateTo: "إلى تاريخ",
    sortBy: "ترتيب حسب",
    sortDate: "التاريخ",
    sortName: "اسم العميل",
    sortAmount: "المبلغ",
    totalAmount: "المبلغ الإجمالي",
    archivedOn: "تاريخ الأرشفة",
    orderDetails: "تفاصيل الأمر",
    customerProfile: "بيانات العميل",
    workOrderInfo: "معلومات أمر العمل",
    viewInvoice: "عرض الفاتورة",
    printInvoice: "طباعة الفاتورة",
    sendWhatsapp: "إرسال للواتساب",
    archiveRunning: "جاري أرشفة الأوامر المكتملة...",
    archiveDone: "تم أرشفة الأوامر المكتملة بنجاح",
    recordsCount: "عدد السجلات",
    completedOrders: "الأوامر المكتملة",
    selectOrders: "تحديد",
    archiveSelected: "أرشفة المحدد",
    archiveSelectedConfirm: "هل تريد أرشفة الأوامر المحددة؟",
    updateAvailable: "تحديث جديد متوفر",
    updateNow: "تحديث الآن",
    updateDesc: "نسخة محسنة جاهزة للتثبيت",
    clusters: "المجموعات",
    clusterGroup: "مجموعة",
    ordersInCluster: "طلب في المجموعة",
    zoomInCluster: "تكبير المجموعة",
    satelliteView: "قمر صناعي",
    defaultView: "افتراضي",
    visitOrder: "ترتيب الزيارة",
    route: "المسار",
    routeColors: "ألوان المسارات",
    tapClusterHint: "اضغط على مجموعة لعرض الطلبات الفردية",
    deleteOrder: "حذف نهائي",
    confirmDeleteOrder: "هل أنت متأكد من الحذف النهائي لهذا الأمر؟ لا يمكن التراجع عن هذا الإجراء.",
    bulkDeleteSelected: "حذف المحدد",
    bulkDeleteConfirm: "هل أنت أصلًا متاكد من حذف الأوامر المحددة نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.",
    selectAll: "تحديد الكل",
    deselectAll: "إلغاء التحديد",
    selectedCount: "تم تحديد {count} عناصر",
    longPressHint: "اضغط مطولاً للتحديد",
    deletePermanently: "حذف النهائي",
    managerEditOrder: "تعديل أمر العمل (مدير)",
    saveChanges: "حفظ التعديلات",
    editOrderFields: "تعديل بيانات الأمر",
    changesSaved: "تم حفظ التعديلات بنجاح",
    longPressEditHint: "اضغط مطولاً على أي أمر لتعديله",
    viewCustomersMap: "عرض العملاء على الخريطة",
    inventoryConsumptionReport: "تقرير استهلاك المخزون",
    consumptionReportTitle: "تقرير استهلاك المخزون الميداني",
    consumptionDate: "التاريخ",
    consumptionFullReport: "تقرير شامل",
    consumptionToday: "استهلاك اليوم",
    consumptionNoData: "لا توجد تركيبات في التاريخ المحدد",
    consumptionTotalInstallations: "إجمالي التركيبات",
    consumptionQuantity: "الكمية",
    consumptionProduct: "المنتج",
    consumptionTechnician: "الفني",
    consumptionAutoPriced: "تم حساب المبلغ تلقائياً",
    cashCollection: "تحصيل النقدي",
    cashCollected: "تم تحصيل مبلغ نقدي",
    cashCollectAmount: "تحصيل",
    cashTotalForDay: "إجمالي النقدي لليوم",
    cashTotalAllTime: "إجمالي النقدي الكلي",
    consumptionGrandTotal: "الإجمالي الكلي للتركيبات",
    scanIdOcr: "مسح الهوية (OCR)",
    ocrScanning: "جاري مسح الهوية...",
    ocrConfirmTitle: "تأكيد الاسم المستخرج من الهوية",
    ocrConfirmName: "الاسم المستخرج",
    ocrNoName: "لم يتم التعرف على الاسم، يرجى الإدخال يدوياً",
    ocrConfirm: "تأكيد وإدخال الاسم",
    ocrRetake: "إعادة المسح",
    invoiceProduct: "المنتج",
    invoiceQty: "الكمية",
    invoiceUnitPrice: "سعر الوحدة",
    invoiceLineTotal: "الإجمالي",
    invoiceGrandTotal: "المجموع الإجمالي",
    invoiceAmountPaid: "المبلغ المدفوع",
    invoiceRemaining: "المتبقي",
    toastOrderCreated: "تم إضافة أمر عمل جديد بنجاح 📋",
    toastOrderCancelled: "تم إلغاء أمر العمل ❌",
    toastOrderCompleted: "تم إكمال أمر العمل بنجاح وتسجيل الاستهلاك 🚀",
    toastCashCollected: "تم تأكيد تحصيل المبلغ النقدي للفني {name} بنجاح 💰",
  },
  en: {
    appTitle: "MZ SMART",
    appSubtitle: "Automatic Doors & Smart Lock Systems",
    dashboard: "Dashboard",
    workOrders: "Work Orders",
    inventory: "Inventory",
    management: "Management",
    techMap: "Order Map",
    adminMap: "Tech Maps",
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    loginError: "Invalid credentials",
    accountDeactivated: "Your account has been deactivated by administration",
    welcome: "Welcome",
    roleAdmin: "Admin",
    roleTechnician: "Technician",
    totalRevenue: "Amount Paid",
    warrantyTerms: "Warranty Terms & Guidelines",
    warrantyNote: "1. Coverage: The warranty covers manufacturing defects of devices and technical faults resulting from the installation process only.\n2. Weather: The warranty does not cover faults or damage caused by bad weather conditions.\n3. Electrical: The warranty does not cover faults caused by fluctuation or rise and fall of electrical current at the site.",
    totalWorkOrders: "Total Work Orders",
    activeTechnicians: "Active Technicians",
    lowStockAlerts: "Low Stock Alerts",
    revenueBreakdown: "Revenue Breakdown (OMR)",
    orderStatusDistribution: "Work Order Status Distribution",
    cash: "Cash",
    bankTransfer: "Bank Transfer",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    newOrder: "New Work Order",
    searchOrders: "Search orders, clients, technicians...",
    filterAll: "All",
    assignTechnician: "Assigned Technician",
    selectTechnician: "Select technician",
    clientName: "Client Name",
    clientPhone: "Client Phone",
    clientLocation: "Client Location",
    gpsLink: "Client location link or GPS coordinates",
    gpsAutoDetect: "Auto-detect",
    openGoogleMaps: "Open Google Maps",
    product: "Product",
    selectProduct: "Select product",
    amountOmr: "Amount (OMR)",
    warranty: "Warranty",
    warrantyNone: "No warranty",
    warranty1y: "1 year",
    warranty2y: "2 years",
    warranty3y: "3 years",
    paymentMethod: "Payment Method",
    installationChecklist: "Installation Checklist",
    maintenanceChecklist: "Maintenance & Installation Checklist",
    notes: "Notes",
    maintenanceNotes: "Maintenance & Installation Notes",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    startWork: "Start Work",
    completeOrder: "Complete Order",
    orderCompletedSuccess: "Data saved and order completed successfully",
    cancelOrder: "Cancel Order",
    cancelReason: "Please write the cancellation reason (mandatory)",
    cancelReasonPlaceholder: "Write cancellation reason here...",
    call: "Call",
    whatsapp: "WhatsApp",
    map: "Map",
    noLocationLink: "No location link for this order",
    orderNumber: "Order #",
    status: "Status",
    technician: "Technician",
    actions: "Actions",
    noOrders: "No work orders",
    routeLabel: "Route",
    manageTechnicians: "Manage Technicians",
    addTechnician: "Add Technician",
    technicianName: "Technician Name",
    deleteTechnician: "Delete Technician",
    confirmDelete: "Are you sure you want to delete?",
    manageProducts: "Manage Products & Inventory",
    searchProducts: "Search products or categories...",
    categoryAll: "All",
    categoryLock: "Smart Locks",
    categoryDoor: "Automatic Doors",
    productCode: "Product Code",
    productName: "Product Name",
    productCategory: "Category",
    productPrice: "Price (OMR)",
    totalStock: "Total Stock",
    reorderLevel: "Reorder Level",
    availableStock: "Available Stock",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete Product",
    inStock: "In Stock",
    lowStock: "Low Stock",
    outStock: "Out of Stock",
    receiptAttached: "Bank transfer receipt attached",
    finalPhotoAttached: "Installation completion photo attached",
    idImageAttached: "Client ID image attached",
    uploadReceipt: "Upload transfer receipt",
    uploadFinalPhoto: "Upload completion photo",
    uploadIdImage: "Attach client ID (image only)",
    invoice: "Invoice",
    invoiceId: "Invoice ID",
    invoiceDate: "Date",
    downloadInvoice: "Download Invoice",
    invoicePreviewTitle: "Electronic Invoice Preview",
    sendToCustomer: "Send Invoice to Customer",
    workOrderMap: "Work Order Map",
    techOrdersMap: "Technician Order Maps",
    back: "Back",
    selectTechnicianMap: "Select a technician to view map",
    legendCompleted: "Completed",
    legendCancelled: "Cancelled",
    legendPending: "Pending",
    legendInProgress: "In Progress",
    bulkImport: "Import & Auto-Dispatch Orders",
    bulkImportTitle: "Import & Auto-Dispatch Orders",
    bulkImportPlaceholder: "Paste raw WhatsApp chat contents here... (customer names, phone numbers, Google Maps links, product details, preferred times)",
    bulkImportParse: "Parse Text",
    bulkImportDispatch: "Dispatch & Create Orders",
    bulkImportPreview: "Preview Extracted Orders",
    bulkImportSuccess: "Orders created successfully",
    bulkImportParsing: "Parsing...",
    bulkImportDispatching: "Dispatching & creating...",
    pastePhone: "Paste Phone",
    addNewOrderCard: "+ Add New Work Order",
    analyzeCard: "Analyze",
    cardRawPlaceholder: "Paste customer text here... (name, phone, map link, product, time)",
    cardAnalyzed: "Analyzed",
    cardPending: "Pending analysis",
    noCards: "No cards yet. Click \"Add New Work Order\" to start.",
    selectTechniciansTitle: "Select Technicians for Dispatch",
    selectTechniciansHint: "Select technicians (1, 2, or 3)",
    noActiveTechs: "No active technicians. Add technicians first.",
    confirmDispatch: "Dispatch & Create Orders",
    cardPhone: "Phone",
    cardProduct: "Product",
    cardTime: "Time",
    cardLocation: "Location",
    deleteCard: "Delete",
    editCard: "Edit",
    cardsCount: "cards",
    draftSaved: "Auto-saved",
    aiAnalyzing: "AI analyzing...",
    aiSource: "AI parsed",
    fallbackSource: "Local parse",
    colName: "Name",
    colPhone: "Phone",
    colLocation: "Location",
    colProduct: "Product",
    colTime: "Time",
    colTech: "Technician",
    colRoute: "Route",
    missingPhone: "Phone missing",
    noParsedOrders: "No orders found. Paste text and try again.",
    whatsappMessage: (o) =>
      `Hello ${o.client_name || ""}\nYour installation has been completed successfully, order number\n${o.order_number}\nThank you for your trust.`,
    customerDatabase: "🗄️ Customer Database",
    customerDatabaseTitle: "Customer Database",
    searchCustomers: "Search: customer name, phone, technician...",
    archivedOrders: "Archived Orders",
    noArchivedOrders: "No archived customer records",
    dateFrom: "From date",
    dateTo: "To date",
    sortBy: "Sort by",
    sortDate: "Date",
    sortName: "Customer Name",
    sortAmount: "Amount",
    totalAmount: "Total Amount",
    archivedOn: "Archived on",
    orderDetails: "Order Details",
    customerProfile: "Customer Profile",
    workOrderInfo: "Work Order Info",
    viewInvoice: "View Invoice",
    printInvoice: "Print Invoice",
    sendWhatsapp: "Send to WhatsApp",
    archiveRunning: "Archiving completed orders...",
    archiveDone: "Completed orders archived successfully",
    recordsCount: "Records",
    completedOrders: "Completed Orders",
    selectOrders: "Select",
    archiveSelected: "Archive Selected",
    archiveSelectedConfirm: "Archive the selected orders?",
    updateAvailable: "New update available",
    updateNow: "Update Now",
    updateDesc: "Improved version ready to install",
    clusters: "Clusters",
    clusterGroup: "Group",
    ordersInCluster: "orders in cluster",
    zoomInCluster: "Zoom into cluster",
    satelliteView: "Satellite",
    defaultView: "Default",
    visitOrder: "Visit Order",
    route: "Route",
    routeColors: "Route Colors",
    tapClusterHint: "Tap a cluster to reveal individual orders",
    deleteOrder: "Delete Permanently",
    confirmDeleteOrder: "Are you sure you want to permanently delete this order? This action cannot be undone.",
    bulkDeleteSelected: "Delete Selected",
    bulkDeleteConfirm: "Are you absolutely sure you want to permanently delete the selected orders from the database? This action cannot be undone.",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    selectedCount: "{count} items selected",
    longPressHint: "Long-press to select",
    deletePermanently: "Delete Permanently",
    managerEditOrder: "Edit Work Order (Manager)",
    saveChanges: "Save Changes",
    editOrderFields: "Edit Order Details",
    changesSaved: "Changes saved successfully",
    longPressEditHint: "Long-press any order to edit it",
    viewCustomersMap: "View Customers on Map",
    inventoryConsumptionReport: "Inventory Consumption Report",
    consumptionReportTitle: "Field Inventory Consumption Report",
    consumptionDate: "Date",
    consumptionFullReport: "Full Report",
    consumptionToday: "Today's Consumption",
    consumptionNoData: "No installations on the selected date",
    consumptionTotalInstallations: "Total Installations",
    consumptionQuantity: "Quantity",
    consumptionProduct: "Product",
    consumptionTechnician: "Technician",
    consumptionAutoPriced: "Amount auto-calculated",
    cashCollection: "Cash Collection",
    cashCollected: "Cash collected",
    cashCollectAmount: "Collect",
    cashTotalForDay: "Total Cash Today",
    cashTotalAllTime: "Total Cash All-Time",
    consumptionGrandTotal: "Grand Total Installations",
    scanIdOcr: "Scan ID (OCR)",
    ocrScanning: "Scanning ID...",
    ocrConfirmTitle: "Confirm Name Extracted from ID",
    ocrConfirmName: "Extracted Name",
    ocrNoName: "Could not recognize name, please enter manually",
    ocrConfirm: "Confirm & Use Name",
    ocrRetake: "Re-scan",
    invoiceProduct: "Product",
    invoiceQty: "Qty",
    invoiceUnitPrice: "Unit Price",
    invoiceLineTotal: "Total",
    invoiceGrandTotal: "Grand Total",
    invoiceAmountPaid: "Amount Paid",
    invoiceRemaining: "Remaining",
    toastOrderCreated: "New work order added successfully 📋",
    toastOrderCancelled: "Work order cancelled ❌",
    toastOrderCompleted: "Work order completed and consumption recorded 🚀",
    toastCashCollected: "Cash collection confirmed for {name} 💰",
  },
};

export const checklistItems = [
  { key: "resistance", label_ar: "مقاومة", label_en: "Resistance" },
  { key: "battery_sensor", label_ar: "سينسر بطارية", label_en: "Battery Sensor" },
  { key: "external_power", label_ar: "كهرباء خارجية", label_en: "External Power" },
];

export const warrantyOptions = [
  { value: "0", label_ar: "بدون ضمان", label_en: "No warranty" },
  { value: "12", label_ar: "سنة", label_en: "1 year" },
  { value: "24", label_ar: "سنتين", label_en: "2 years" },
  { value: "36", label_ar: "ثلاث سنوات", label_en: "3 years" },
];

export const categoryLabels: Record<string, { ar: string; en: string }> = {
  door: { ar: "أبواب أوتوماتيكية", en: "Automatic Doors" },
  lock: { ar: "أقفال ذكية", en: "Smart Locks" },
};
