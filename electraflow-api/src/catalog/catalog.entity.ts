import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

export enum CatalogType {
    MATERIAL = 'material',
    SERVICE = 'service',
}

@Entity('catalog_categories')
export class CatalogCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: CatalogType })
    type: CatalogType;

    @Column({ nullable: true })
    parentId: string;

    @ManyToOne(() => CatalogCategory, (category) => category.children, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent: CatalogCategory;

    @OneToMany(() => CatalogCategory, (category) => category.parent)
    children: CatalogCategory[];

    @OneToMany(() => CatalogItem, (item) => item.category)
    items: CatalogItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('catalog_items')
export class CatalogItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    unitPrice: number;

    @Column({ nullable: true })
    unit: string; // e.g., 'm', 'kg', 'h', 'un'

    @Column()
    categoryId: string;

    @ManyToOne(() => CatalogCategory, (category) => category.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categoryId' })
    category: CatalogCategory;

    @Column({ type: 'enum', enum: CatalogType })
    type: CatalogType;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
