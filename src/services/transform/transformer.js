/* eslint-disable new-cap */
import _ from 'lodash';
import RawInfoToChart from '../../libraries/transform/rawInfoToChart';
import RawInfo from '../../libraries/transform/models/rawInfo.model';
import Organisation from '../../libraries/transform/models/organisation.model';
import tracker from '../../plugins/tracker';

export default async function (request, reply) {
    try {
        const result = {};
        const { rawInfos, ...extras } = request.body;
        const organisation = (new Organisation(extras.organisation));
        _.each(rawInfos, async (attrs) => {
            const rawInfo = (new RawInfo({ ...attrs, organisation }));

            let transformer;

            if (rawInfo.component === 'rawInfo-chart') {
                transformer = RawInfoToChart;
            }

            if (transformer) {
                try {
                    result[rawInfo.id] = (new transformer(rawInfo)).transform();
                    result.timing = tracker.timings;
                } catch (e) {
                    result[rawInfo.id] = {
                        error: true,
                        message: e.message,
                        name: e.name,
                        file: `${e.fileName}:${e.lineNumber}:${e.columnNumber}`,
                        proto: e.fileName,
                        stack: e.stack,
                    };
                }
            }
        });

        reply.send(result);
    } catch (e) {
        console.log('transform error', e);
        reply.send({
            error: true,
            message: e.message,
            debug: e.stack,
        }).status(400);
    }
}
