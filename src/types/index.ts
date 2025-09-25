export type UserOut = {
	user_id: number;
	disco_user_id?: string | null;
	email: string;
	full_name: string;
	role: 'student' | 'ssm' | 'admin';
	is_banned: boolean;
};

export type Availability = {
	availability_id: number;
	user_id: number;
	day_of_week: number;
	start_time: string;
	end_time: string;
};

export type OOO = {
	ooo_id: number;
	user_id: number;
	start_datetime: string;
	end_datetime: string;
	reason?: string | null;
};

export type AvailabilityResponse = {
	ssm_ids: number[];
	availabilities: Availability[];
	ooo_blocks: OOO[];
};

export type BookingCreate = {
	student_disco_user_id: string;
	ssm_id: number;
	pathway_id: number;
	start_datetime: string;
	end_datetime: string;
};

export type BookingOut = {
	booking_id: number;
	student_id: number;
	ssm_id: number;
	pathway_id: number;
	start_datetime: string;
	end_datetime: string;
	zoom_meeting_id: string;
	status: string;
}; 