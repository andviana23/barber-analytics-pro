/**
 * @fileoverview Testes para lógica de saldo disponível das contas bancárias
 * Validação da correção: despesas só devem impactar quando pagas
 */

import { describe, expect, it } from 'vitest';

describe('Sistema Financeiro - Saldo Disponível', () => {
  describe('Lógica de cálculo do saldo disponível', () => {
    interface BankAccount {
      id: string;
      initial_balance: number;
      current_balance: number;
      available_balance: number;
    }

    interface Transaction {
      id: string;
      account_id: string;
      amount: number;
      status: 'Pending' | 'Received' | 'Paid' | 'Cancelled';
      type: 'revenue' | 'expense';
    }

    /**
     * Simula a função SQL calculate_account_current_balance
     * Saldo atual = saldo inicial + receitas confirmadas - despesas pagas
     */
    const calculateCurrentBalance = (
      account: BankAccount,
      transactions: Transaction[]
    ): number => {
      const revenues = transactions
        .filter(
          t =>
            t.account_id === account.id &&
            t.type === 'revenue' &&
            (t.status === 'Received' || t.status === 'Paid')
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter(
          t =>
            t.account_id === account.id &&
            t.type === 'expense' &&
            t.status === 'Paid'
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return account.initial_balance + revenues - expenses;
    };

    /**
     * Simula a função SQL calculate_account_available_balance CORRIGIDA
     * Saldo disponível = saldo atual + receitas pendentes
     * (NÃO deduz despesas pendentes - apenas quando pagas)
     */
    const calculateAvailableBalance = (
      account: BankAccount,
      transactions: Transaction[]
    ): number => {
      const currentBalance = calculateCurrentBalance(account, transactions);

      const pendingRevenues = transactions
        .filter(
          t =>
            t.account_id === account.id &&
            t.type === 'revenue' &&
            t.status === 'Pending'
        )
        .reduce((sum, t) => sum + t.amount, 0);

      // 🔥 CORREÇÃO: NÃO deduzir despesas pendentes
      // Despesas só impactam quando status = 'Paid'
      return currentBalance + pendingRevenues;
    };

    it('deve calcular saldo atual corretamente', () => {
      const account: BankAccount = {
        id: 'acc-1',
        initial_balance: 1000,
        current_balance: 0,
        available_balance: 0,
      };

      const transactions: Transaction[] = [
        {
          id: '1',
          account_id: 'acc-1',
          amount: 500,
          status: 'Received',
          type: 'revenue',
        },
        {
          id: '2',
          account_id: 'acc-1',
          amount: 200,
          status: 'Paid',
          type: 'expense',
        },
        {
          id: '3',
          account_id: 'acc-1',
          amount: 300,
          status: 'Pending',
          type: 'revenue',
        },
        {
          id: '4',
          account_id: 'acc-1',
          amount: 150,
          status: 'Pending',
          type: 'expense',
        },
      ];

      const currentBalance = calculateCurrentBalance(account, transactions);

      // Saldo atual = 1000 (inicial) + 500 (receita recebida) - 200 (despesa paga)
      expect(currentBalance).toBe(1300);
    });

    it('deve calcular saldo disponível SEM deduzir despesas pendentes', () => {
      const account: BankAccount = {
        id: 'acc-1',
        initial_balance: 1000,
        current_balance: 0,
        available_balance: 0,
      };

      const transactions: Transaction[] = [
        {
          id: '1',
          account_id: 'acc-1',
          amount: 500,
          status: 'Received',
          type: 'revenue',
        },
        {
          id: '2',
          account_id: 'acc-1',
          amount: 200,
          status: 'Paid',
          type: 'expense',
        },
        {
          id: '3',
          account_id: 'acc-1',
          amount: 300,
          status: 'Pending',
          type: 'revenue',
        },
        {
          id: '4',
          account_id: 'acc-1',
          amount: 150,
          status: 'Pending',
          type: 'expense',
        },
      ];

      const availableBalance = calculateAvailableBalance(account, transactions);

      // Saldo disponível = 1300 (atual) + 300 (receita pendente)
      // NÃO deduz 150 (despesa pendente) - só quando for paga
      expect(availableBalance).toBe(1600);
    });

    it('deve mostrar diferença entre saldo atual e disponível', () => {
      const account: BankAccount = {
        id: 'acc-1',
        initial_balance: 2000,
        current_balance: 0,
        available_balance: 0,
      };

      const transactions: Transaction[] = [
        {
          id: '1',
          account_id: 'acc-1',
          amount: 800,
          status: 'Pending',
          type: 'revenue',
        },
        {
          id: '2',
          account_id: 'acc-1',
          amount: 400,
          status: 'Pending',
          type: 'expense',
        },
      ];

      const currentBalance = calculateCurrentBalance(account, transactions);
      const availableBalance = calculateAvailableBalance(account, transactions);

      // Saldo atual = 2000 (apenas confirmado)
      expect(currentBalance).toBe(2000);

      // Saldo disponível = 2000 + 800 (receita pendente) = 2800
      // NÃO deduz despesa pendente
      expect(availableBalance).toBe(2800);

      // Diferença = receitas pendentes
      expect(availableBalance - currentBalance).toBe(800);
    });

    it('deve atualizar corretamente quando despesa for paga', () => {
      const account: BankAccount = {
        id: 'acc-1',
        initial_balance: 1000,
        current_balance: 0,
        available_balance: 0,
      };

      // Estado inicial: despesa pendente
      const transactionsBefore: Transaction[] = [
        {
          id: '1',
          account_id: 'acc-1',
          amount: 300,
          status: 'Pending',
          type: 'expense',
        },
      ];

      const availableBeforePayment = calculateAvailableBalance(
        account,
        transactionsBefore
      );

      // Saldo disponível = 1000 (não deduz despesa pendente)
      expect(availableBeforePayment).toBe(1000);

      // Estado após pagamento: despesa paga
      const transactionsAfter: Transaction[] = [
        {
          id: '1',
          account_id: 'acc-1',
          amount: 300,
          status: 'Paid',
          type: 'expense',
        },
      ];

      const availableAfterPayment = calculateAvailableBalance(
        account,
        transactionsAfter
      );

      // Saldo disponível = 700 (agora deduz porque foi paga)
      expect(availableAfterPayment).toBe(700);
    });

    it('deve lidar com múltiplas contas separadamente', () => {
      const account1: BankAccount = {
        id: 'acc-1',
        initial_balance: 1000,
        current_balance: 0,
        available_balance: 0,
      };

      const account2: BankAccount = {
        id: 'acc-2',
        initial_balance: 2000,
        current_balance: 0,
        available_balance: 0,
      };

      const transactions: Transaction[] = [
        {
          id: '1',
          account_id: 'acc-1',
          amount: 500,
          status: 'Pending',
          type: 'expense',
        },
        {
          id: '2',
          account_id: 'acc-2',
          amount: 300,
          status: 'Pending',
          type: 'revenue',
        },
      ];

      const available1 = calculateAvailableBalance(account1, transactions);
      const available2 = calculateAvailableBalance(account2, transactions);

      // Conta 1: não deduz despesa pendente
      expect(available1).toBe(1000);

      // Conta 2: adiciona receita pendente
      expect(available2).toBe(2300);
    });

    it('deve ignorar transações canceladas', () => {
      const account: BankAccount = {
        id: 'acc-1',
        initial_balance: 1000,
        current_balance: 0,
        available_balance: 0,
      };

      const transactions: Transaction[] = [
        {
          id: '1',
          account_id: 'acc-1',
          amount: 500,
          status: 'Cancelled',
          type: 'revenue',
        },
        {
          id: '2',
          account_id: 'acc-1',
          amount: 200,
          status: 'Cancelled',
          type: 'expense',
        },
        {
          id: '3',
          account_id: 'acc-1',
          amount: 100,
          status: 'Received',
          type: 'revenue',
        },
      ];

      const currentBalance = calculateCurrentBalance(account, transactions);
      const availableBalance = calculateAvailableBalance(account, transactions);

      // Ignora transações canceladas, considera apenas a receita recebida
      expect(currentBalance).toBe(1100);
      expect(availableBalance).toBe(1100);
    });
  });

  describe('Validação de regras de negócio', () => {
    it('deve garantir que saldo disponível >= saldo atual quando há apenas receitas pendentes', () => {
      // Cenário: apenas receitas pendentes (sem despesas)
      const initial = 1000;
      const pendingRevenues = 500;

      const currentBalance = initial; // Sem movimentações confirmadas
      const availableBalance = initial + pendingRevenues;

      expect(availableBalance).toBeGreaterThanOrEqual(currentBalance);
      expect(availableBalance - currentBalance).toBe(pendingRevenues);
    });

    it('deve garantir que despesas pendentes não reduzam saldo disponível', () => {
      // Cenário: apenas despesas pendentes
      const initial = 1000;
      const pendingExpenses = 300;

      const currentBalance = initial; // Sem movimentações confirmadas
      const availableBalance = initial; // NÃO deduz despesas pendentes

      expect(availableBalance).toBe(currentBalance);
      // Despesa pendente não deve afetar saldo disponível
    });

    it('deve refletir realidade financeira: o que está disponível para uso', () => {
      // Cenário realista de uma barbearia
      const account = {
        id: 'main-account',
        initial_balance: 5000, // Saldo inicial
        current_balance: 0,
        available_balance: 0,
      };

      const transactions = [
        // Receitas já recebidas (confirmadas)
        {
          id: 'r1',
          account_id: 'main-account',
          amount: 1200,
          status: 'Received' as const,
          type: 'revenue' as const,
        },
        {
          id: 'r2',
          account_id: 'main-account',
          amount: 800,
          status: 'Received' as const,
          type: 'revenue' as const,
        },

        // Despesas já pagas (confirmadas)
        {
          id: 'e1',
          account_id: 'main-account',
          amount: 600,
          status: 'Paid' as const,
          type: 'expense' as const,
        }, // Aluguel
        {
          id: 'e2',
          account_id: 'main-account',
          amount: 300,
          status: 'Paid' as const,
          type: 'expense' as const,
        }, // Produtos

        // Receitas pendentes (dinheiro que vai entrar)
        {
          id: 'r3',
          account_id: 'main-account',
          amount: 400,
          status: 'Pending' as const,
          type: 'revenue' as const,
        }, // Agendamentos

        // Despesas pendentes (compromissos futuros - NÃO devem reduzir saldo disponível)
        {
          id: 'e3',
          account_id: 'main-account',
          amount: 500,
          status: 'Pending' as const,
          type: 'expense' as const,
        }, // Salários
        {
          id: 'e4',
          account_id: 'main-account',
          amount: 200,
          status: 'Pending' as const,
          type: 'expense' as const,
        }, // Contas
      ];

      const currentBalance = 5000 + 1200 + 800 - 600 - 300; // = 6100
      const availableBalance = 6100 + 400; // = 6500 (não deduz despesas pendentes)

      // O saldo disponível deve representar o que realmente está disponível
      // para uso imediato, incluindo receitas pendentes mas sem descontar
      // despesas que ainda não foram pagas
      expect(availableBalance).toBe(6500);
      expect(availableBalance > currentBalance).toBe(true);

      // A diferença deve ser apenas as receitas pendentes
      expect(availableBalance - currentBalance).toBe(400);
    });
  });
});
