import React, { useState } from 'react';
import { ArrowRight, Code2, Copy, Check, Download, Layers, Terminal, Sparkles, Smartphone, Server } from 'lucide-react';

interface CodeExporterScreenProps {
  onBack: () => void;
}

export const CodeExporterScreen: React.FC<CodeExporterScreenProps> = ({ onBack }) => {
  const [activePlatform, setActivePlatform] = useState<'flutter' | 'laravel'>('flutter');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const flutterFiles = [
    {
      id: 'flutter_pubspec',
      name: 'pubspec.yaml',
      desc: 'حزم Flutter الرسمية: Riverpod, Dio, QR Scanner, NFC Manager, Printing',
      code: `name: modern_british_kids
description: "تطبيق إدارة حضانة Modern British Kids الذكي للموبايل والتابلت"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  flutter_riverpod: ^2.5.1
  dio: ^5.4.3+1
  mobile_scanner: ^5.1.1
  nfc_manager: ^3.3.0
  pdf: ^3.10.8
  printing: ^5.12.0
  intl: ^0.19.0
  google_fonts: ^6.2.1
  shared_preferences: ^2.2.3
  flutter_secure_storage: ^9.0.0
  audioplayers: ^6.0.0
  uuid: ^4.4.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/sounds/`
    },
    {
      id: 'flutter_main',
      name: 'lib/main.dart',
      desc: 'نقطة الانطلاق مع تفعيل RTL واللغة العربية و Material 3',
      code: `import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: ModernBritishKidsApp()));
}

class ModernBritishKidsApp extends StatelessWidget {
  const ModernBritishKidsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Modern British Kids',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar', 'EG'),
      supportedLocales: const [
        Locale('ar', 'EG'),
        Locale('en', 'US'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A), // British Royal Navy
          primary: const Color(0xFF1E3A8A),
          secondary: const Color(0xFFD97706), // Royal Gold
        ),
        textTheme: GoogleFonts.cairoTextTheme(),
      ),
      home: const MainMobileNavigation(),
    );
  }
}`
    },
    {
      id: 'flutter_qr_scanner',
      name: 'lib/features/attendance/qr_scanner_page.dart',
      desc: 'شاشة مسح كود QR وحضور الطفل السريع',
      code: `import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrAttendancePage extends StatefulWidget {
  const QrAttendancePage({super.key});

  @override
  State<QrAttendancePage> createState() => _QrAttendancePageState();
}

class _QrAttendancePageState extends State<QrAttendancePage> {
  final MobileScannerController _controller = MobileScannerController();
  DateTime? _lastScanTime;

  void _onDetect(BarcodeCapture capture) {
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null || barcode.rawValue == null) return;

    // Anti-bounce check (25 seconds)
    final now = DateTime.now();
    if (_lastScanTime != null && now.difference(_lastScanTime!).inSeconds < 25) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم المسح مسبقاً! يرجى الانتظار لتفادي التكرار')),
      );
      return;
    }
    _lastScanTime = now;

    // Call API /api/v1/attendance/qr-scan
    _recordAttendance(barcode.rawValue!);
  }

  void _recordAttendance(String qrCode) async {
    // API Call implementation via Dio
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('قارئ QR الذكي - الحضور')),
      body: MobileScanner(
        controller: _controller,
        onDetect: _onDetect,
      ),
    );
  }
}`
    },
    {
      id: 'flutter_build_commands',
      name: 'Terminal Build Commands (APK & AAB)',
      desc: 'أوامر استخراج ملفات APK و Android App Bundle للنشر الفعلي',
      code: `# 1. تنزيل الاعتماديات
flutter pub get

# 2. توليد ملف APK للأندرويد (تثبيت مباشر على الهواتف والتابلت)
flutter build apk --release

# 3. توليد ملف Android App Bundle (AAB) لمتجر Google Play
flutter build appbundle --release

# 4. توليد نسخة الـ iOS (لأجهزة iPhone و iPad)
flutter build ipa --release`
    }
  ];

  const laravelFiles = [
    {
      id: 'laravel_routes',
      name: 'routes/api.php',
      desc: 'مسارات REST API المنظمة في Laravel 11 مع Sanctum',
      code: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Api\\AuthController;
use App\\Http\\Controllers\\Api\\ChildController;
use App\\Http\\Controllers\\Api\\AttendanceController;
use App\\Http\\Controllers\\Api\\PaymentController;
use App\\Http\\Controllers\\Api\\PayrollController;
use App\\Http\\Controllers\\Api\\ExpenseController;
use App\\Http\\Controllers\\Api\\ReportController;

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);

        // Children Module
        Route::apiResource('/children', ChildController::class);
        
        // Smart Attendance (QR & RFID)
        Route::post('/attendance/qr-scan', [AttendanceController::class, 'recordQrScan']);
        Route::post('/attendance/rfid-swipe', [AttendanceController::class, 'recordRfidSwipe']);
        Route::get('/attendance/today', [AttendanceController::class, 'getTodayAttendance']);
        Route::post('/attendance/batch-present', [AttendanceController::class, 'markAllPresent']);

        // Finance & Rapid Fees Collection
        Route::post('/payments/collect-fee', [PaymentController::class, 'collectChildFee']);
        Route::get('/receipts/{id}', [PaymentController::class, 'showReceipt']);
        
        // Expenses & Secondary Income
        Route::apiResource('/expenses', ExpenseController::class);
        Route::get('/income/secondary', [ExpenseController::class, 'getSecondaryIncome']);

        // Payroll
        Route::get('/payroll', [PayrollController::class, 'index']);
        Route::post('/payroll/{id}/disburse', [PayrollController::class, 'disburse']);

        // Month Closing & Financial Overview
        Route::post('/finance/close-month', [ReportController::class, 'closeMonth'])
            ->middleware('can:close-month');
        Route::post('/finance/reopen-month', [ReportController::class, 'reopenMonth'])
            ->middleware('can:reopen-month');
    });
});`
    },
    {
      id: 'laravel_migrations',
      name: 'database/migrations/create_nursery_tables.php',
      desc: 'مخطط جداول قاعدة البيانات مع دقة DECIMAL(12,2) للأموال',
      code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Children Table
        Schema::create('children', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // MBK-2401
            $table->string('full_name');
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date');
            $table->date('enrollment_date');
            $table->foreignId('level_id')->constrained();
            $table->foreignId('class_id')->constrained();
            $table->decimal('monthly_fee', 12, 2);
            $table->decimal('bus_fee', 12, 2)->default(0);
            $table->enum('status', ['active', 'leave', 'suspended', 'withdrawn', 'graduated'])->default('active');
            $table->string('rfid_card_uid')->nullable()->unique();
            $table->string('qr_payload')->unique();
            $table->text('allergies')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('guardian_id')->constrained();
            $table->timestamps();
        });

        // Payments & Receipts Table with Idempotency Key
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique(); // REC-2026-1001
            $table->string('idempotency_key')->unique(); // Prevent duplicate charges
            $table->foreignId('child_id')->constrained();
            $table->smallInteger('month');
            $table->smallInteger('year');
            $table->decimal('amount', 12, 2);
            $table->string('payment_method'); // cash, instapay, vodafone_cash, card
            $table->string('transaction_ref')->nullable();
            $table->decimal('remaining_balance', 12, 2);
            $table->foreignId('collected_by_user_id')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Attendance Table
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained();
            $table->date('date')->index();
            $table->enum('status', ['present', 'absent', 'late', 'leave', 'excused']);
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->enum('method', ['manual', 'qr', 'rfid']);
            $table->foreignId('recorded_by_user_id')->constrained('users');
            $table->timestamps();
            $table->unique(['child_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('children');
    }
};`
    },
    {
      id: 'laravel_controller',
      name: 'app/Http/Controllers/Api/PaymentController.php',
      desc: 'كنترولر التحصيل المالي السريع ومنع التكرار بـ Idempotency Key',
      code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use App\\Models\\Payment;
use App\\Models\\Child;

class PaymentController extends Controller
{
    public function collectChildFee(Request $request)
    {
        $validated = $request->validate([
            'child_id' => 'required|exists:children,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'idempotency_key' => 'required|string',
            'transaction_ref' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        // 1. Idempotency check: prevent duplicate billing on unstable mobile networks
        $existing = Payment::where('idempotency_key', $validated['idempotency_key'])->first();
        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'تم استرجاع الإيصال المسجل مسبقاً وتفادي التكرار',
                'receipt' => $existing,
            ]);
        }

        return DB::transaction(function () use ($validated, $request) {
            $child = Child::findOrFail($validated['child_id']);
            
            // Generate sequence receipt number
            $seq = Payment::count() + 1001;
            $receiptNum = "REC-{$validated['year']}-{$seq}";

            $payment = Payment::create([
                'receipt_number' => $receiptNum,
                'idempotency_key' => $validated['idempotency_key'],
                'child_id' => $child->id,
                'month' => $validated['month'],
                'year' => $validated['year'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'transaction_ref' => $validated['transaction_ref'] ?? null,
                'remaining_balance' => 0.00,
                'collected_by_user_id' => $request->user()->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل التحصيل بنجاح وإصدار الإيصال المعتمد',
                'receipt' => $payment,
            ], 201);
        });
    }
}`
    }
  ];

  const currentFiles = activePlatform === 'flutter' ? flutterFiles : laravelFiles;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              مركز تصدير كود Flutter و Laravel
            </h2>
            <span className="text-[10px] text-slate-400">ملفات المشروع الجاهزة للبناء والتثبيت</span>
          </div>
        </div>
      </div>

      {/* Platform Switcher Tabs */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setActivePlatform('flutter')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activePlatform === 'flutter'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Flutter Mobile App (Dart / Android & iOS)</span>
        </button>

        <button
          onClick={() => setActivePlatform('laravel')}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activePlatform === 'laravel'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Laravel 11 Backend (PHP / MySQL API)</span>
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
        {activePlatform === 'flutter' ? (
          <div>
            <span className="font-bold block mb-0.5">جاهزية تطبيق Flutter:</span>
            تمت هيكلة المشروع بنمط Feature-Based Architecture مع Riverpod، وهو مهيأ لاستخراج ملفات APK و AAB لأجهزة Android بالإضافة لـ iOS Build.
          </div>
        ) : (
          <div>
            <span className="font-bold block mb-0.5">جاهزية خادم Laravel 11:</span>
            واجهات برمجة REST API كاملة مع حماية المعاملات المالية (Transactions)، منع التكرار بـ Idempotency Key، ودقة DECIMAL(12,2).
          </div>
        )}
      </div>

      {/* Code Blocks List */}
      <div className="space-y-3 pb-6">
        {currentFiles.map((file) => (
          <div
            key={file.id}
            className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md overflow-hidden text-left"
            dir="ltr"
          >
            {/* File Header */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400 block">{file.name}</span>
                <span className="text-[10px] text-slate-400 font-sans text-right">{file.desc}</span>
              </div>

              <button
                onClick={() => copyCode(file.id, file.code)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === file.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-300 max-h-56">
              <pre>{file.code}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
