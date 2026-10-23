import type {Language} from './preferences';
export const connectionText={
 ja:{description:'保存済みのExcelへ接続し、Organizations／Membersシートを読み直して、必要な列と組織データを確認します。予定表取得のテストではありません。',signin:'先に、この設定画面の「Microsoft 365でサインイン」を押してください。',url:'Excel URLを入力し、「保存・読込」を押してから接続テストを実行してください。',consent:'先に、この設定画面の「予定表・Excelの読取を許可」を押してください。',success:'Excelの読込と組織データの確認が完了しました。'},
 en:{description:'Connects to the saved Excel workbook, reloads Organizations / Members, and validates required columns and organization data. This does not test calendars.',signin:'First click Sign in with Microsoft 365 in these settings.',url:'Enter the Excel URL and click Save & load before running the connection test.',consent:'First click Allow calendar & Excel read access in these settings.',success:'Excel and organization data checks completed.'},
 zh:{description:'连接已保存的 Excel，重新读取 Organizations／Members 并检查必需列及组织数据。这不是日历获取测试。',signin:'请先点击此设置中的“使用 Microsoft 365 登录”。',url:'输入 Excel 地址并点击“保存并加载”后再运行连接测试。',consent:'请先点击此设置中的“允许读取日历与 Excel”。',success:'Excel 读取和组织数据检查已完成。'}
};
export function connectionProblem(signedIn:boolean,url:string,approved:boolean,language:Language){const t=connectionText[language];return !signedIn?t.signin:!url?t.url:!approved?t.consent:'';}
