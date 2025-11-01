/**
 * @file professionalCommissionService.js
 * @description Service para gerenciamento de comissões personalizadas por profissional
 * @module Services/ProfessionalCommission
 * @author Barber Analytics Pro Team
 * @date 2025-01-25
 *
 * Funcionalidades:
 * - Buscar comissões de um profissional por serviço
 * - Atualizar comissão personalizada de um profissional
 * - Integração com tabela services (comissão padrão)
 * - Suporte a comissões personalizadas via tabela professional_service_commissions
 */

import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

/**
 * Busca todas as comissões de um profissional por serviço
 * Retorna serviços da unidade com comissão padrão ou personalizada
 *
 * @param {string} professionalId - ID do profissional
 * @param {string} unitId - ID da unidade
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function getProfessionalCommissions(professionalId, unitId) {
  try {
    console.log(
      '🔍 Buscando comissões para profissional:',
      professionalId,
      'unidade:',
      unitId
    );

    // Validação: se não houver unidade, retorna erro claro para a camada de UI
    if (!unitId) {
      console.warn(
        '⚠️ getProfessionalCommissions chamado sem unitId. professionalId:',
        professionalId
      );
      return { data: null, error: 'Unidade não informada' };
    }

    // Busca todos os serviços da unidade com comissões padrão
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(
        `
        id,
        name,
        price,
        commission_percentage,
        duration_minutes,
        active
      `
      )
      .eq('unit_id', unitId)
      .eq('active', true)
      .order('name', { ascending: true });

    if (servicesError) {
      console.error('❌ Erro ao buscar serviços:', servicesError);
      console.error('❌ Detalhes do erro:', {
        message: servicesError.message,
        details: servicesError.details,
        hint: servicesError.hint,
        code: servicesError.code,
      });
      return {
        data: null,
        error: 'Erro ao carregar serviços da unidade',
      };
    }

    // Busca comissões personalizadas do profissional (se existirem)
    const { data: customCommissions, error: commissionsError } = await supabase
      .from('professional_service_commissions')
      .select('service_id, commission_percentage')
      .eq('professional_id', professionalId)
      .eq('is_active', true);

    if (commissionsError && commissionsError.code !== 'PGRST116') {
      // PGRST116 = tabela não existe, ignoramos esse erro
      console.warn(
        '⚠️ Aviso ao buscar comissões personalizadas:',
        commissionsError
      );
    }

    // Combina serviços com comissões personalizadas
    const commissionsMap = new Map();
    customCommissions?.forEach(comm => {
      commissionsMap.set(comm.service_id, comm.commission_percentage);
    });

    const result = services.map(service => ({
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.duration_minutes,
      defaultCommission: service.commission_percentage,
      currentCommission:
        commissionsMap.get(service.id) ?? service.commission_percentage,
      isCustom: commissionsMap.has(service.id),
    }));

    console.log('✅ Comissões carregadas:', result.length, 'serviços');
    return { data: result, error: null };
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar comissões:', error);
    return {
      data: null,
      error: 'Erro inesperado ao carregar comissões',
    };
  }
}

/**
 * Atualiza a comissão personalizada de um profissional para um serviço
 *
 * @param {Object} params - Parâmetros da atualização
 * @param {string} params.professionalId - ID do profissional
 * @param {string} params.unitId - ID da unidade
 * @param {string} params.serviceId - ID do serviço
 * @param {number} params.commission - Nova porcentagem de comissão (0-100)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateProfessionalCommission({
  professionalId,
  unitId,
  serviceId,
  commission,
}) {
  try {
    console.log('💾 Atualizando comissão:', {
      professionalId,
      serviceId,
      commission,
    });

    // Validação básica
    if (!professionalId || !unitId || !serviceId) {
      return {
        data: null,
        error: 'Parâmetros obrigatórios não fornecidos',
      };
    }

    if (commission < 0 || commission > 100) {
      return {
        data: null,
        error: 'Comissão deve estar entre 0% e 100%',
      };
    }

    // Verifica se o serviço existe e pertence à unidade
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, commission_percentage, unit_id')
      .eq('id', serviceId)
      .eq('unit_id', unitId)
      .eq('active', true)
      .single();

    if (serviceError || !service) {
      console.error('❌ Serviço não encontrado:', serviceError);
      return {
        data: null,
        error: 'Serviço não encontrado ou inativo',
      };
    }

    // Se a comissão é igual à padrão, remove a personalização
    if (commission === service.commission_percentage) {
      const { error: deleteError } = await supabase
        .from('professional_service_commissions')
        .delete()
        .eq('professional_id', professionalId)
        .eq('service_id', serviceId);

      if (deleteError && deleteError.code !== 'PGRST116') {
        console.error(
          '❌ Erro ao remover comissão personalizada:',
          deleteError
        );
        return {
          data: null,
          error: 'Erro ao remover personalização de comissão',
        };
      }

      console.log('✅ Comissão personalizada removida (volta ao padrão)');
      toast.success('Comissão restaurada para o valor padrão');
      return { data: { commission, isCustom: false }, error: null };
    }

    // Tenta criar/atualizar a comissão personalizada
    const { data: result, error: upsertError } = await supabase
      .from('professional_service_commissions')
      .upsert(
        {
          professional_id: professionalId,
          service_id: serviceId,
          commission_percentage: commission,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'professional_id,service_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('❌ Erro ao salvar comissão personalizada:', upsertError);
      console.error('❌ Código do erro:', upsertError.code);
      console.error('❌ Detalhes:', upsertError.details);

      // Se a tabela não existe (404 ou PGRST116)
      if (
        upsertError.code === 'PGRST116' ||
        upsertError.code === '42P01' ||
        upsertError.message?.includes('404')
      ) {
        toast.error(
          'A tabela de comissões personalizadas ainda não foi criada no banco. Execute a migration primeiro.',
          { duration: 6000 }
        );
        return {
          data: null,
          error:
            'Tabela professional_service_commissions não existe. Execute a migration SQL primeiro.',
        };
      }

      // Outros erros
      toast.error(
        'Erro ao salvar comissão. Verifique o console para detalhes.'
      );
      return {
        data: null,
        error: upsertError.message || 'Erro ao salvar comissão personalizada',
      };
    }

    console.log('✅ Comissão personalizada salva:', result);
    toast.success('Comissão atualizada com sucesso');
    return { data: { commission, isCustom: true }, error: null };
  } catch (error) {
    console.error('💥 Erro inesperado ao atualizar comissão:', error);
    return {
      data: null,
      error: 'Erro inesperado ao salvar comissão',
    };
  }
}

/**
 * Busca a comissão efetiva de um profissional para um serviço específico
 * Usado durante o fechamento de comandas para calcular comissões
 *
 * @param {string} professionalId - ID do profissional
 * @param {string} serviceId - ID do serviço
 * @returns {Promise<{commission: number, error: string|null}>}
 */
export async function getEffectiveCommission(professionalId, serviceId) {
  try {
    // Busca comissão personalizada primeiro
    const { data: customCommission, error: customError } = await supabase
      .from('professional_service_commissions')
      .select('commission_percentage')
      .eq('professional_id', professionalId)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .single();

    if (customCommission && !customError) {
      return {
        commission: customCommission.commission_percentage,
        error: null,
      };
    }

    // Se não tem personalizada, usa a padrão do serviço
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('commission_percentage')
      .eq('id', serviceId)
      .eq('active', true)
      .single();

    if (serviceError || !service) {
      return { commission: 0, error: 'Serviço não encontrado' };
    }

    return { commission: service.commission_percentage, error: null };
  } catch (error) {
    console.error('💥 Erro ao buscar comissão efetiva:', error);
    return { commission: 0, error: 'Erro ao calcular comissão' };
  }
}

/**
 * Remove todas as comissões personalizadas de um profissional
 * Usado quando um profissional é desativado ou transferido
 *
 * @param {string} professionalId - ID do profissional
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function clearProfessionalCommissions(professionalId) {
  try {
    const { error } = await supabase
      .from('professional_service_commissions')
      .update({ is_active: false })
      .eq('professional_id', professionalId);

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao limpar comissões:', error);
      return { success: false, error: 'Erro ao limpar comissões' };
    }

    console.log('✅ Comissões do profissional limpas');
    return { success: true, error: null };
  } catch (error) {
    console.error('💥 Erro inesperado ao limpar comissões:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}
