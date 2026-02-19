import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogCategory, CatalogItem, CatalogType } from './catalog.entity';

@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    // Categories
    @Get('categories')
    findAllCategories(@Query('type') type?: CatalogType) {
        return this.catalogService.findAllCategories(type);
    }

    @Get('categories/tree')
    findCategoryTree(@Query('type') type?: CatalogType) {
        return this.catalogService.findCategoryTree(type);
    }

    @Post('categories')
    createCategory(@Body() data: Partial<CatalogCategory>) {
        return this.catalogService.createCategory(data);
    }

    @Put('categories/:id')
    updateCategory(@Param('id') id: string, @Body() data: Partial<CatalogCategory>) {
        return this.catalogService.updateCategory(id, data);
    }

    @Delete('categories/:id')
    removeCategory(@Param('id') id: string) {
        return this.catalogService.removeCategory(id);
    }

    // Items
    @Get('items')
    findAllItems(@Query('type') type?: CatalogType, @Query('categoryId') categoryId?: string) {
        return this.catalogService.findAllItems(type, categoryId);
    }

    @Get('search')
    searchCatalog(@Query('q') query: string, @Query('type') type?: CatalogType) {
        return this.catalogService.searchCatalog(query, type);
    }

    @Get('categories/:id/items')
    getCategoryItems(@Param('id') id: string) {
        return this.catalogService.findItemsByCategory(id);
    }

    @Post('items')
    createItem(@Body() data: Partial<CatalogItem>) {
        return this.catalogService.createItem(data);
    }

    @Put('items/:id')
    updateItem(@Param('id') id: string, @Body() data: Partial<CatalogItem>) {
        return this.catalogService.updateItem(id, data);
    }

    @Delete('items/:id')
    removeItem(@Param('id') id: string) {
        return this.catalogService.removeItem(id);
    }
}
