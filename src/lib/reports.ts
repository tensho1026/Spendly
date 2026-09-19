import { prisma } from "@/lib/prisma";
import { dateInputToUtc, jstParts, jstStartOfDay, toDateInputValue } from "@/lib/format";
import { formatMonthParam, monthRange, shiftMonth, type MonthParam } from "@/lib/month";

export async function getAnnualReport(endMonth: MonthParam) {
  const months = Array.from({ length: 12 }, (_, index) => shiftMonth(endMonth, index - 11));
  const periods = months.map(formatMonthParam);
  const start = monthRange(months[0]).start, end = monthRange(shiftMonth(endMonth, 1)).start;
  const yearAgo = shiftMonth(endMonth, -12), yearAgoRange = monthRange(yearAgo);
  const [days, fixed, incomes, yearAgoDays, yearAgoFixed, yearAgoIncomes] = await Promise.all([
    prisma.dailyExpense.findMany({ where: { date: { gte: start, lt: end } }, include: { items: { include: { category: true, tags: { include: { tag: true } } } } } }),
    prisma.fixedExpense.findMany({ where: { month: { in: periods } }, include: { category: true } }),
    prisma.income.findMany({ where: { date: { gte: start, lt: end } } }),
    prisma.dailyExpense.findMany({ where: { date: { gte: yearAgoRange.start, lt: yearAgoRange.end } } }),
    prisma.fixedExpense.findMany({ where: { month: formatMonthParam(yearAgo) } }),
    prisma.income.findMany({ where: { date: { gte: yearAgoRange.start, lt: yearAgoRange.end } } }),
  ]);
  const rows = months.map((month) => ({ period: formatMonthParam(month), label: `${month.month}月`, income: 0, expense: 0, balance: 0 }));
  const byPeriod = new Map(rows.map((row) => [row.period, row]));
  for (const day of days) { const p=jstParts(day.date), row=byPeriod.get(formatMonthParam({year:p.year,month:p.month})); if(row) row.expense += day.total; }
  for (const item of fixed) { const row=byPeriod.get(item.month); if(row) row.expense += item.amount; }
  for (const income of incomes) { const p=jstParts(income.date), row=byPeriod.get(formatMonthParam({year:p.year,month:p.month})); if(row) row.income += income.amount; }
  for (const row of rows) row.balance = row.income - row.expense;
  const categories = new Map<string,{name:string;total:number}>(), tags = new Map<string,{name:string;color:string;total:number}>();
  for (const day of days) for (const item of day.items) {
    const category=categories.get(item.categoryId)??{name:item.category.name,total:0}; category.total+=item.amount; categories.set(item.categoryId,category);
    for(const link of item.tags){const tag=tags.get(link.tagId)??{name:link.tag.name,color:link.tag.color,total:0};tag.total+=item.amount;tags.set(link.tagId,tag)}
  }
  for(const item of fixed){const category=categories.get(item.categoryId)??{name:item.category.name,total:0};category.total+=item.amount;categories.set(item.categoryId,category)}
  const current=rows.at(-1)!;
  const previousYear={income:yearAgoIncomes.reduce((s,x)=>s+x.amount,0),expense:yearAgoDays.reduce((s,x)=>s+x.total,0)+yearAgoFixed.reduce((s,x)=>s+x.amount,0)};
  return { rows, averageIncome: Math.round(rows.reduce((s,x)=>s+x.income,0)/12), averageExpense: Math.round(rows.reduce((s,x)=>s+x.expense,0)/12), highest: [...rows].sort((a,b)=>b.expense-a.expense)[0], categories:[...categories.values()].sort((a,b)=>b.total-a.total).map(x=>({...x,average:Math.round(x.total/12)})), tags:[...tags.values()].sort((a,b)=>b.total-a.total), yoy:{income:current.income-previousYear.income,expense:current.expense-previousYear.expense,balance:current.balance-(previousYear.income-previousYear.expense)}, yearAgo };
}

export async function getWeeklyReport(dateValue?: string) {
  const requested=dateValue ? dateInputToUtc(dateValue) : null, base=requested??new Date();
  const p=jstParts(base), weekday=new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay(), offset=(weekday+6)%7;
  const start=jstStartOfDay(p.year,p.month,p.day-offset), end=new Date(start.getTime()+7*86400000);
  const [days,incomes]=await Promise.all([
    prisma.dailyExpense.findMany({where:{date:{gte:start,lt:end}},include:{items:{include:{category:true}}}}),
    prisma.income.findMany({where:{date:{gte:start,lt:end}}}),
  ]);
  const rows=Array.from({length:7},(_,i)=>{const date=new Date(start.getTime()+i*86400000);return{date:toDateInputValue(date),label:["月","火","水","木","金","土","日"][i],expense:0,income:0}}), byDate=new Map(rows.map(x=>[x.date,x]));
  for(const day of days){const row=byDate.get(toDateInputValue(day.date));if(row)row.expense+=day.total} for(const item of incomes){const row=byDate.get(toDateInputValue(item.date));if(row)row.income+=item.amount}
  const categories=new Map<string,{name:string;total:number}>();for(const day of days)for(const item of day.items){const row=categories.get(item.categoryId)??{name:item.category.name,total:0};row.total+=item.amount;categories.set(item.categoryId,row)}
  return { rows, start:toDateInputValue(start), end:toDateInputValue(new Date(end.getTime()-86400000)), income:rows.reduce((s,x)=>s+x.income,0), expense:rows.reduce((s,x)=>s+x.expense,0), categories:[...categories.values()].sort((a,b)=>b.total-a.total) };
}
