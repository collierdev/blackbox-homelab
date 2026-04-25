export interface LightFixture {
    id: string;
    name: string;
    lightIds: string[];
    icon?: string;
    room?: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreateFixtureInput {
    name: string;
    lightIds: string[];
    icon?: string;
    room?: string;
}
export interface UpdateFixtureInput {
    name?: string;
    lightIds?: string[];
    icon?: string;
    room?: string;
    order?: number;
}
export declare function createFixture(input: CreateFixtureInput): Promise<LightFixture>;
export declare function getAllFixtures(): Promise<LightFixture[]>;
export declare function getFixtureById(id: string): Promise<LightFixture | null>;
export declare function getFixturesByRoom(room: string): Promise<LightFixture[]>;
export declare function updateFixture(id: string, input: UpdateFixtureInput): Promise<LightFixture | null>;
export declare function deleteFixture(id: string): Promise<boolean>;
export declare function addLightToFixture(fixtureId: string, lightId: string): Promise<LightFixture | null>;
export declare function removeLightFromFixture(fixtureId: string, lightId: string): Promise<LightFixture | null>;
export declare function reorderFixtures(fixtureOrders: {
    id: string;
    order: number;
}[]): Promise<void>;
//# sourceMappingURL=fixture.d.ts.map