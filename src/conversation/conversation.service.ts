import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Conversation,
  ConversationState,
} from '../entities/conversation.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private repo: Repository<Conversation>,
  ) {}

  async getOrCreate(waUserId: string): Promise<Conversation> {
    let conv = await this.repo.findOne({ where: { waUserId } });
    if (!conv) {
      conv = this.repo.create({ waUserId, state: ConversationState.IDLE });
      await this.repo.save(conv);
    }
    return conv;
  }

  async setPendingSelection(
    waUserId: string,
    candidatos: Array<{
      id: string;
      monodroga: string;
      nombre: string;
      presentacion: string;
      laboratorio: string;
      precio: number;
    }>,
  ): Promise<void> {
    const conv = await this.getOrCreate(waUserId);
    conv.state = ConversationState.PENDING_SELECTION;
    conv.context = { candidatos };
    await this.repo.save(conv);
  }

  async resolveSelection(
    waUserId: string,
    index: number,
  ): Promise<{ id: string; monodroga: string; nombreComercial: string; presentacion: string; laboratorio: string; precio: number } | null> {
    const conv = await this.getOrCreate(waUserId);
    const candidatos = conv.context?.candidatos ?? [];
    const selected = candidatos[index];
    if (!selected) return null;

    const { candidatos: _c, ...restContext } = conv.context ?? {};
    conv.state = ConversationState.IDLE;
    conv.context = {
      ...restContext,
      productoSeleccionado: {
        id: selected.id,
        monodroga: selected.monodroga ?? '',
        nombreComercial: selected.nombre,
        presentacion: selected.presentacion,
        laboratorio: selected.laboratorio,
        precio: selected.precio,
      },
    };
    await this.repo.save(conv);
    return conv.context?.productoSeleccionado ?? null;
  }

  async clearSelection(waUserId: string): Promise<void> {
    const conv = await this.getOrCreate(waUserId);
    conv.state = ConversationState.IDLE;
    conv.context = null;
    await this.repo.save(conv);
  }
}
