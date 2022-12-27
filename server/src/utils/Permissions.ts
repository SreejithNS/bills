/* eslint-disable import/prefer-default-export */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Permission {
	export enum Authentication {
		CREATE_USER,
		CREATE_ORGANISATION,
		
		UPDATE_USER,
		UPDATE_ORGANISATION,

		GET_USER,
		GET_ORGANISATION_BY_ID,
	}

	export enum Authorization {
		IS_ADMIN,
		IS_ROOT,


		CREATE_ROLE,

		UPDATE_ROLE,

		READ_ROLE,

		DELETE_ROLE,
	}
}

export type Permissions = typeof Permission[keyof typeof Permission];