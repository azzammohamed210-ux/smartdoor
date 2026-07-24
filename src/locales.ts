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
  cancelOrder: string;
  cancelReason: string;
  cancelReasonPlaceholder: string;
  call: string;
  whatsapp: string;
  map: string;
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
  colName: string;
  colPhone: string;
  colLocation: string;
  colProduct: string;
  colTime: string;
  colTech: string;
  colRoute: string;
  missingPhone: string;
  noParsedOrders: string;
  whatsappMessage: (o: { order_number: string; client_name?: string; amount: number; warranty_months: number }) => string;
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
}

export const translations: Record<Lang, Strings> = {
  ar: {
    appTitle: "سمارت دور عمان",
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
    totalRevenue: "إجمالي الإيرادات",
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
    completeOrder: "اكتمل الأمر",
    cancelOrder: "إلغاء الأمر",
    cancelReason: "يرجى كتابة سبب الإلغاء (إجباري)",
    cancelReasonPlaceholder: "اكتب سبب الإلغاء هنا...",
    call: "اتصال",
    whatsapp: "واتساب",
    map: "الخريطة",
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
      `مرحباً بك في سمارت دور، تم إنجاز طلبكم بنجاح. يمكنك تحميل فاتورتكم الرسمية الإلكترونية من هنا. رقم الطلب: ${o.order_number}${o.client_name ? " - العميل: " + o.client_name : ""}. المبلغ: ${o.amount.toFixed(3)} ر.ع. الضمان: ${o.warranty_months} شهر. شكراً لثقتكم بنا.`,
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
  },
  en: {
    appTitle: "Smart Door Oman",
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
    totalRevenue: "Total Revenue",
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
    cancelOrder: "Cancel Order",
    cancelReason: "Please write the cancellation reason (mandatory)",
    cancelReasonPlaceholder: "Write cancellation reason here...",
    call: "Call",
    whatsapp: "WhatsApp",
    map: "Map",
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
      `Welcome to Smart Door. Your order ${o.order_number}${o.client_name ? " for " + o.client_name : ""} has been completed successfully. You can download your official electronic invoice here. Amount: ${o.amount.toFixed(3)} OMR. Warranty: ${o.warranty_months} months. Thank you for your trust.`,
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
