"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
var helmet_1 = __importDefault(require("helmet"));
var cors_1 = __importDefault(require("cors"));
var path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: 'src/config/.env'
});
var express_1 = __importDefault(require("express"));
var app = express_1.default();
app.use(helmet_1.default());
app.use(cors_1.default());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '..', 'uploads')));
var controllers_1 = __importDefault(require("./controllers"));
controllers_1.default(app);
exports.default = app;
