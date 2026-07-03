import { useCallback, useEffect, useMemo, useState } from 'react'
import { financeService } from './financeService.js'

export function useFinance(userId) {
  const [snapshot, setSnapshot] = useState(() =>
    userId
      ? financeService.getSnapshot(userId)
      : {
          accounts: [],
          activeAccounts: [],
          budgetHistory: [],
          budgets: [],
          categories: [],
          goalContributions: [],
          notifications: [],
          recurringTransactions: [],
          savingsGoals: [],
          transactions: [],
        }
  )

  const refresh = useCallback(() => {
    if (!userId) {
      return
    }

    setSnapshot(financeService.getSnapshot(userId))
  }, [userId])

  useEffect(() => {
    const handleUpdate = () => refresh()
    window.addEventListener('finance-app:finance-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('finance-app:finance-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [refresh])

  const actions = useMemo(
    () => ({
      archiveAccount: (accountId) => financeService.archiveAccount(userId, accountId),
      addGoalContribution: (goalId, payload) =>
        financeService.addGoalContribution(userId, goalId, payload),
      createTransaction: (payload) => financeService.createTransaction(userId, payload),
      deleteBudget: (budgetId) => financeService.deleteBudget(userId, budgetId),
      deleteCategory: (categoryId, reassignCategoryId) =>
        financeService.deleteCategory(userId, categoryId, reassignCategoryId),
      deleteNotification: (notificationId) =>
        financeService.deleteNotification(userId, notificationId),
      deleteRecurring: (recurringId) => financeService.deleteRecurring(userId, recurringId),
      deleteSavingsGoal: (goalId) => financeService.deleteSavingsGoal(userId, goalId),
      deleteTransaction: (transactionId) => financeService.deleteTransaction(userId, transactionId),
      deleteUserData: () => financeService.deleteUserData(userId),
      exportUserData: () => financeService.exportUserData(userId),
      markAllNotificationsRead: () => financeService.markAllNotificationsRead(userId),
      markNotificationRead: (notificationId) =>
        financeService.markNotificationRead(userId, notificationId),
      saveAccount: (payload) => financeService.saveAccount(userId, payload),
      saveBudget: (payload) => financeService.saveBudget(userId, payload),
      saveCategory: (payload) => financeService.saveCategory(userId, payload),
      saveSavingsGoal: (payload) => financeService.saveSavingsGoal(userId, payload),
      toggleRecurring: (recurringId) => financeService.toggleRecurring(userId, recurringId),
      transfer: (payload) => financeService.transfer(userId, payload),
      updateTransaction: (transactionId, payload) =>
        financeService.updateTransaction(userId, transactionId, payload),
    }),
    [userId]
  )

  return { ...snapshot, actions, refresh }
}
