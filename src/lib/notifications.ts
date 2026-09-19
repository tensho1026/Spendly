import { getBudgets, getDays, getFixed, summarizeDays } from "@/lib/ledger";
import { currentMonth, formatMonthParam, type MonthParam } from "@/lib/month";
import { combineCategorySpend, percentage } from "@/lib/planning";
import { jstParts } from "@/lib/format";

export type AppNotification={id:string;level:"info"|"warning"|"danger";title:string;description:string;href:string};
export async function getNotifications(month:MonthParam=currentMonth()):Promise<AppNotification[]>{
  const period=formatMonthParam(month),[days,fixed,budgets]=await Promise.all([getDays(month),getFixed(period),getBudgets(period)]),summary=summarizeDays(days),spend=combineCategorySpend(summary.breakdown.map(x=>({categoryId:x.categoryId,name:x.name,amount:x.total})),fixed.map(x=>({categoryId:x.categoryId,name:x.category.name,amount:x.amount}))),used=new Map(spend.map(x=>[x.categoryId,x.amount])),result:AppNotification[]=[];
  for(const budget of budgets){const amount=used.get(budget.categoryId)??0,ratio=percentage(amount,budget.amount);if(ratio>=100)result.push({id:`budget-over-${budget.id}`,level:"danger",title:`${budget.category.name}の予算を超過`,description:`${ratio}%使用・${amount-budget.amount}円超過しています。`,href:`/budgets?month=${period}`});else if(ratio>=80)result.push({id:`budget-80-${budget.id}`,level:"warning",title:`${budget.category.name}の予算が80%を超えました`,description:`${ratio}%使用・残り${budget.amount-amount}円です。`,href:`/budgets?month=${period}`})}
  const now=jstParts(new Date()),isCurrent=now.year===month.year&&now.month===month.month;if(isCurrent){const recorded=new Set(days.map(x=>jstParts(x.date).day)),start=Math.max(1,now.day-2),missing=[];for(let day=start;day<=now.day;day++)if(!recorded.has(day))missing.push(day);if(missing.length===now.day-start+1&&missing.length>=3)result.push({id:"missing-days",level:"warning",title:"3日間、支出が未入力です",description:`${month.month}/${start}〜${month.month}/${now.day}の記録を確認しましょう。`,href:`/expenses/new`});for(const item of fixed){if(item.dueDay&&item.dueDay>=now.day&&item.dueDay<=now.day+3)result.push({id:`fixed-${item.id}`,level:"info",title:`${item.memo||item.category.name}の支払日が近づいています`,description:`${month.month}月${item.dueDay}日・${item.amount.toLocaleString("ja-JP")}円`,href:`/fixed-expenses?month=${period}`})}
  }
  return result;
}
