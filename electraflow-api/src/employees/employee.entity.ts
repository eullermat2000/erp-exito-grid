import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EmployeeDocument } from './employee-document.entity';

export enum EmployeeRole {
    ADMINISTRATIVE = 'administrative',
    OPERATIONAL = 'operational',
    ENGINEERING = 'engineering',
}

export enum EmployeeStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({
        type: 'text',
        default: EmployeeRole.OPERATIONAL,
    })
    role: EmployeeRole;

    @Column({ nullable: true })
    specialty: string;

    @Column({
        type: 'text',
        default: EmployeeStatus.ACTIVE,
    })
    status: EmployeeStatus;

    @Column({ nullable: true })
    hiredAt: Date;

    @OneToMany('EmployeeDocument', 'employee')
    documents: EmployeeDocument[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
