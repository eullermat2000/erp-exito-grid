import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogCategory, CatalogItem, CatalogType } from './catalog.entity';

@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(CatalogCategory)
        private categoryRepository: Repository<CatalogCategory>,
        @InjectRepository(CatalogItem)
        private itemRepository: Repository<CatalogItem>,
    ) { }

    // Categories
    async findAllCategories(type?: CatalogType): Promise<CatalogCategory[]> {
        const where: any = {};
        if (type) where.type = type;
        return this.categoryRepository.find({
            where,
            relations: ['children', 'parent'],
            order: { name: 'ASC' },
        });
    }

    async findCategoryTree(type?: CatalogType): Promise<CatalogCategory[]> {
        const where: any = { parentId: null };
        if (type) where.type = type;
        return this.categoryRepository.find({
            where,
            relations: ['children', 'children.children'],
            order: { name: 'ASC' },
        });
    }

    async createCategory(data: Partial<CatalogCategory>): Promise<CatalogCategory> {
        const category = this.categoryRepository.create(data);
        return this.categoryRepository.save(category);
    }

    async updateCategory(id: string, data: Partial<CatalogCategory>): Promise<CatalogCategory> {
        await this.categoryRepository.update(id, data);
        return this.categoryRepository.findOne({ where: { id }, relations: ['parent'] });
    }

    async removeCategory(id: string): Promise<void> {
        await this.categoryRepository.delete(id);
    }

    // Items
    async findAllItems(type?: CatalogType, categoryId?: string): Promise<CatalogItem[]> {
        const where: any = {};
        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;
        return this.itemRepository.find({
            where,
            relations: ['category'],
            order: { name: 'ASC' },
        });
    }

    async searchCatalog(query: string, type?: CatalogType): Promise<any[]> {
        const itemQb = this.itemRepository.createQueryBuilder('item')
            .leftJoinAndSelect('item.category', 'category')
            .where('item.name ILIKE :query OR item.description ILIKE :query', { query: `%${query}%` });

        const catQb = this.categoryRepository.createQueryBuilder('category')
            .where('category.name ILIKE :query', { query: `%${query}%` });

        if (type) {
            itemQb.andWhere('item.type = :type', { type });
            catQb.andWhere('category.type = :type', { type });
        }

        const items = await itemQb.orderBy('item.name', 'ASC').take(15).getMany();
        const categories = await catQb.orderBy('category.name', 'ASC').take(5).getMany();

        return [
            ...categories.map(c => ({ ...c, dataType: 'category' })),
            ...items.map(i => ({ ...i, dataType: 'item' }))
        ];
    }

    async findItemsByCategory(categoryId: string): Promise<CatalogItem[]> {
        return this.itemRepository.find({
            where: { categoryId },
            order: { name: 'ASC' },
        });
    }

    async createItem(data: Partial<CatalogItem>): Promise<CatalogItem> {
        const item = this.itemRepository.create(data);
        return this.itemRepository.save(item);
    }

    async updateItem(id: string, data: Partial<CatalogItem>): Promise<CatalogItem> {
        await this.itemRepository.update(id, data);
        return this.itemRepository.findOne({ where: { id }, relations: ['category'] });
    }

    async removeItem(id: string): Promise<void> {
        await this.itemRepository.delete(id);
    }
}
