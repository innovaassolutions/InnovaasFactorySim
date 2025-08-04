#!/usr/bin/env node
"use strict";
/**
 * UMH Integration Startup Script
 * Deploys the complete UMH-Core + CNC Simulator + TimescaleDB stack
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs_1 = require("fs");
// ANSI color codes for output
var colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};
function log(message, color) {
    if (color === void 0) { color = colors.reset; }
    console.log("".concat(color).concat(message).concat(colors.reset));
}
function runCommand(command, args) {
    return new Promise(function (resolve, reject) {
        var process = (0, child_process_1.spawn)(command, args, { stdio: 'inherit', shell: true });
        process.on('close', function (code) {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error("Command failed with exit code ".concat(code)));
            }
        });
        process.on('error', function (error) {
            reject(error);
        });
    });
}
function checkPrerequisites() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('\n🔍 Checking prerequisites...', colors.yellow);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, runCommand('docker', ['version'])];
                case 2:
                    _a.sent();
                    log('✅ Docker is running', colors.green);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    log('❌ Docker is not running or not installed', colors.red);
                    throw error_1;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, runCommand('docker-compose', ['version'])];
                case 5:
                    _a.sent();
                    log('✅ Docker Compose is available', colors.green);
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    log('❌ Docker Compose is not available', colors.red);
                    throw error_2;
                case 7:
                    // Check if compose file exists
                    if (!(0, fs_1.existsSync)('./docker-compose.umh-integration.yml')) {
                        log('❌ docker-compose.umh-integration.yml not found', colors.red);
                        throw new Error('Docker Compose file not found');
                    }
                    log('✅ Docker Compose file found', colors.green);
                    return [2 /*return*/];
            }
        });
    });
}
function buildImages() {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('\n🏗️  Building CNC Simulator image...', colors.yellow);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, runCommand('docker-compose', [
                            '-f', 'docker-compose.umh-integration.yml',
                            'build', 'cnc-simulator'
                        ])];
                case 2:
                    _a.sent();
                    log('✅ CNC Simulator image built successfully', colors.green);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    log('❌ Failed to build CNC Simulator image', colors.red);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function startServices() {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('\n🚀 Starting UMH integration services...', colors.yellow);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, runCommand('docker-compose', [
                            '-f', 'docker-compose.umh-integration.yml',
                            'up', '-d'
                        ])];
                case 2:
                    _a.sent();
                    log('✅ Services started successfully', colors.green);
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    log('❌ Failed to start services', colors.red);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function waitForServices() {
    return __awaiter(this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('\n⏳ Waiting for services to be healthy...', colors.yellow);
                    // Wait for services to start up
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10000); })];
                case 1:
                    // Wait for services to start up
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, runCommand('docker-compose', [
                            '-f', 'docker-compose.umh-integration.yml',
                            'ps'
                        ])];
                case 3:
                    _a.sent();
                    log('✅ Service status checked', colors.green);
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    log('⚠️  Could not check service status', colors.yellow);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function showServiceInfo() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            log('\n📊 UMH Integration Services:', colors.bright);
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
            log('🏭 UMH Core:', colors.cyan);
            log('   • API: http://localhost:8090', colors.reset);
            log('   • Kafka: localhost:9092', colors.reset);
            log('   • Topic Browser: http://localhost:8091', colors.reset);
            log('\n🗄️  TimescaleDB:', colors.cyan);
            log('   • Host: localhost:5432', colors.reset);
            log('   • Database: uns_production', colors.reset);
            log('   • User: uns_admin', colors.reset);
            log('\n🏭 CNC Simulator:', colors.cyan);
            log('   • Status: Publishing to UMH-Core via HTTP API', colors.reset);
            log('   • Machines: 10 simulated CNC machines', colors.reset);
            log('   • Interval: 5 seconds', colors.reset);
            log('\n🐳 Portainer:', colors.cyan);
            log('   • URL: http://localhost:9000', colors.reset);
            log('   • Purpose: Container management UI', colors.reset);
            log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
            log('\n🔧 Useful Commands:', colors.bright);
            log('   • View logs: docker-compose -f docker-compose.umh-integration.yml logs -f', colors.reset);
            log('   • Stop services: docker-compose -f docker-compose.umh-integration.yml down', colors.reset);
            log('   • Restart services: docker-compose -f docker-compose.umh-integration.yml restart', colors.reset);
            return [2 /*return*/];
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    log('🚀 UMH Integration Deployment Starting...', colors.bright);
                    return [4 /*yield*/, checkPrerequisites()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, buildImages()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, startServices()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, waitForServices()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, showServiceInfo()];
                case 5:
                    _a.sent();
                    log('\n✅ UMH Integration deployment completed successfully!', colors.green);
                    log('🌟 The system is now ready for data ingestion and processing.', colors.green);
                    return [3 /*break*/, 7];
                case 6:
                    error_6 = _a.sent();
                    log('\n❌ Deployment failed:', colors.red);
                    log(error_6 instanceof Error ? error_6.message : String(error_6), colors.red);
                    process.exit(1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Handle script interruption
process.on('SIGINT', function () {
    log('\n\n⚠️  Deployment interrupted by user', colors.yellow);
    process.exit(0);
});
main().catch(function (error) {
    log('❌ Unexpected error:', colors.red);
    console.error(error);
    process.exit(1);
});
